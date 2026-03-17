import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Plus, Medal, Target, Calendar, Upload, Video, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ZONES } from '@/lib/shotZones';

interface Challenge {
  id: string;
  title: string;
  description: string;
  zone: string | null;
  target_percentage: number;
  target_attempts: number;
  bonus_points: number;
  week_start: string;
  week_end: string;
  created_by: string;
  period_type: string;
}

interface Entry {
  id: string;
  challenge_id: string;
  player_id: string;
  attempts: number;
  made: number;
  percentage: number;
  video_url?: string | null;
  player_name?: string;
}

const PERIOD_LABELS: Record<string, string> = {
  weekly: 'שבועי',
  monthly: 'חודשי',
  custom: 'מותאם אישית',
};

const WeeklyChallenges = () => {
  const { user, auth } = useAuth();
  const isCoach = auth.role === 'coach';
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [entries, setEntries] = useState<Record<string, Entry[]>>({});
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', zone: 'all',
    target_percentage: 50, target_attempts: 20,
    bonus_points: 0, period_type: 'weekly',
  });

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from('weekly_challenges')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(10);
    if (data) {
      setChallenges(data as unknown as Challenge[]);
      const ids = data.map((c: any) => c.id);
      if (ids.length > 0) {
        const { data: entriesData } = await supabase
          .from('challenge_entries')
          .select('*')
          .in('challenge_id', ids)
          .order('percentage', { ascending: false });

        if (entriesData) {
          const playerIds = [...new Set(entriesData.map((e: any) => e.player_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', playerIds);
          const nameMap: Record<string, string> = {};
          profiles?.forEach((p: any) => { nameMap[p.user_id] = p.display_name; });

          const grouped: Record<string, Entry[]> = {};
          entriesData.forEach((e: any) => {
            if (!grouped[e.challenge_id]) grouped[e.challenge_id] = [];
            grouped[e.challenge_id].push({ ...e, player_name: nameMap[e.player_id] || 'שחקן' });
          });
          setEntries(grouped);
        }
      }
    }
  };

  useEffect(() => { fetchChallenges(); }, []);

  const getDateRange = () => {
    const now = new Date();
    if (form.period_type === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { week_start: start.toISOString().split('T')[0], week_end: end.toISOString().split('T')[0] };
    }
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { week_start: start.toISOString().split('T')[0], week_end: end.toISOString().split('T')[0] };
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('יש להזין כותרת'); return; }
    setCreating(true);
    const dateRange = getDateRange();
    const { error } = await supabase.from('weekly_challenges').insert({
      title: form.title,
      description: form.description,
      zone: form.zone === 'all' ? null : form.zone,
      target_percentage: form.target_percentage,
      target_attempts: form.target_attempts,
      bonus_points: form.bonus_points || 0,
      created_by: user?.id,
      period_type: form.period_type,
      ...dateRange,
    });
    if (error) { toast.error('שגיאה ביצירת אתגר'); }
    else {
      toast.success('אתגר חדש נוצר!');
      setShowForm(false);
      setForm({ title: '', description: '', zone: 'all', target_percentage: 50, target_attempts: 20, bonus_points: 0, period_type: 'weekly' });
      fetchChallenges();
    }
    setCreating(false);
  };

  const handleSubmitEntry = async (challengeId: string, attempts: number, made: number, videoUrl: string) => {
    if (!videoUrl) { toast.error('חובה להעלות סרטון הוכחה'); return; }
    const percentage = attempts > 0 ? Math.round((made / attempts) * 100) : 0;
    const { error } = await supabase.from('challenge_entries').upsert({
      challenge_id: challengeId,
      player_id: user?.id,
      attempts,
      made,
      percentage,
      video_url: videoUrl,
    }, { onConflict: 'challenge_id,player_id' });
    if (error) toast.error('שגיאה בשליחת תוצאות');
    else { toast.success('תוצאות נשלחו!'); fetchChallenges(); }
  };

  const getZoneLabel = (zone: string | null) => {
    if (!zone) return 'כל האזורים';
    return ZONES.find(z => z.id === zone)?.label || zone;
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Medal className="h-4 w-4 text-yellow-400" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Medal className="h-4 w-4 text-amber-700" />;
    return <span className="text-xs text-muted-foreground w-4 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {isCoach && (
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="gradient-accent text-accent-foreground">
              <Plus className="ml-1 h-4 w-4" />
              אתגר חדש
            </Button>
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span>אתגרי המערכת</span>
          <Trophy className="h-5 w-5 text-accent" />
        </h2>
      </div>

      {/* Create form */}
      {showForm && isCoach && (
        <div className="gradient-card rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label className="text-right block">כותרת האתגר</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder='לדוגמה: "אתגר שלשות החודש"' className="text-right" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-right block">תיאור</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="תיאור קצר של האתגר" className="text-right" />
            </div>
            <div className="space-y-1">
              <Label className="text-right block">סוג אתגר</Label>
              <Select value={form.period_type} onValueChange={v => setForm({ ...form, period_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">שבועי</SelectItem>
                  <SelectItem value="monthly">חודשי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-right block">אזור</Label>
              <Select value={form.zone} onValueChange={v => setForm({ ...form, zone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל האזורים</SelectItem>
                  {ZONES.map(z => <SelectItem key={z.id} value={z.id}>{z.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-right block">יעד אחוז קליעה</Label>
              <Input type="number" value={form.target_percentage} onChange={e => setForm({ ...form, target_percentage: Number(e.target.value) })} min={1} max={100} />
            </div>
            <div className="space-y-1">
              <Label className="text-right block">מספר ניסיונות</Label>
              <Input type="number" value={form.target_attempts} onChange={e => setForm({ ...form, target_attempts: Number(e.target.value) })} min={5} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-right block">נקודות בונוס להצלחה באתגר</Label>
              <Input type="number" value={form.bonus_points} onChange={e => setForm({ ...form, bonus_points: Number(e.target.value) })} min={0} placeholder="0 = ללא בונוס" />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full gradient-accent text-accent-foreground">
            {creating ? 'יוצר...' : 'צור אתגר'}
          </Button>
        </div>
      )}

      {/* Challenges list */}
      {challenges.length === 0 ? (
        <div className="gradient-card rounded-xl p-6 text-center">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">אין אתגרים פעילים כרגע</p>
        </div>
      ) : (
        challenges.map(c => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            entries={entries[c.id] || []}
            isCoach={isCoach}
            userId={user?.id}
            getZoneLabel={getZoneLabel}
            getMedalIcon={getMedalIcon}
            onSubmitEntry={handleSubmitEntry}
          />
        ))
      )}
    </div>
  );
};

const ChallengeCard = ({
  challenge, entries, isCoach, userId, getZoneLabel, getMedalIcon, onSubmitEntry
}: {
  challenge: Challenge; entries: Entry[]; isCoach: boolean; userId?: string;
  getZoneLabel: (z: string | null) => string; getMedalIcon: (i: number) => JSX.Element;
  onSubmitEntry: (id: string, attempts: number, made: number, videoUrl: string) => void;
}) => {
  const [attempts, setAttempts] = useState('');
  const [made, setMade] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const myEntry = entries.find(e => e.player_id === userId);

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) { toast.error('יש להעלות קובץ וידאו בלבד'); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error('גודל קובץ מקסימלי: 100MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `challenges/${userId}/${challenge.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('shot-videos').upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { toast.error('שגיאה בהעלאת הסרטון'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('shot-videos').getPublicUrl(path);
    setVideoUrl(urlData.publicUrl);
    toast.success('הסרטון הועלה!');
    setUploading(false);
  };

  return (
    <div className="gradient-card rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
            {getZoneLabel(challenge.zone)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {PERIOD_LABELS[challenge.period_type] || challenge.period_type}
          </span>
        </div>
        <div className="text-right">
          <h3 className="font-semibold text-foreground">{challenge.title}</h3>
          {challenge.description && <p className="text-xs text-muted-foreground">{challenge.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            יעד: {challenge.target_percentage}% · {challenge.target_attempts} ניסיונות
            {challenge.bonus_points > 0 && <span className="text-accent font-medium"> · 🎁 {challenge.bonus_points} נקודות</span>}
            {' · '}{new Date(challenge.week_start).toLocaleDateString('he-IL')} - {new Date(challenge.week_end).toLocaleDateString('he-IL')}
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      {entries.length > 0 && (
        <div className="rounded-lg bg-secondary p-3 mb-3">
          <h4 className="text-xs font-medium text-muted-foreground text-right mb-2">טבלת מובילים</h4>
          <div className="space-y-1.5">
            {entries.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${e.percentage >= challenge.target_percentage ? 'text-success' : 'text-foreground'}`}>
                    {e.percentage}% ({e.made}/{e.attempts})
                  </span>
                  {e.video_url && (
                    <a href={e.video_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      <Video className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{e.player_name}</span>
                  {getMedalIcon(i)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit entry (player only) with mandatory video */}
      {!isCoach && (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]); }}
          />
          {videoUrl ? (
            <div className="rounded-lg bg-secondary p-2 flex items-center gap-2 text-right">
              <Video className="h-4 w-4 text-success shrink-0" />
              <span className="text-xs text-success flex-1">סרטון מצורף ✓</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-dashed border-2 border-accent/30 text-accent"
            >
              {uploading ? (
                <><Loader2 className="ml-1 h-3 w-3 animate-spin" />מעלה סרטון...</>
              ) : (
                <><Upload className="ml-1 h-3 w-3" />העלה סרטון הוכחה (חובה)</>
              )}
            </Button>
          )}
          <div className="flex gap-2 items-end">
            <Button
              size="sm"
              onClick={() => onSubmitEntry(challenge.id, Number(attempts), Number(made), videoUrl)}
              disabled={!attempts || !made || !videoUrl}
              className="gradient-accent text-accent-foreground shrink-0"
            >
              {myEntry ? 'עדכן' : 'שלח'}
            </Button>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-right block">קלועות</Label>
              <Input type="number" min={0} value={made} onChange={e => setMade(e.target.value)} className="h-8 text-right" placeholder={myEntry ? String(myEntry.made) : '0'} />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-right block">ניסיונות</Label>
              <Input type="number" min={1} value={attempts} onChange={e => setAttempts(e.target.value)} className="h-8 text-right" placeholder={myEntry ? String(myEntry.attempts) : '0'} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyChallenges;
