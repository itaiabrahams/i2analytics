import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Swords, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ZONES } from '@/lib/shotZones';

interface PlayerChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  zone: string | null;
  target_attempts: number;
  status: string;
  challenger_attempts: number;
  challenger_made: number;
  challenged_attempts: number;
  challenged_made: number;
  winner_id: string | null;
  created_at: string;
  expires_at: string;
  description: string;
  challenger_name?: string;
  challenged_name?: string;
}

interface PlayerChallengesProps {
  playerId: string;
}

const PlayerChallenges = ({ playerId }: PlayerChallengesProps) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<PlayerChallenge[]>([]);
  const [players, setPlayers] = useState<{ user_id: string; display_name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ challenged_id: '', zone: 'all', target_attempts: 20, description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from('player_challenges')
      .select('*')
      .or(`challenger_id.eq.${playerId},challenged_id.eq.${playerId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      const playerIds = [...new Set(data.flatMap((c: any) => [c.challenger_id, c.challenged_id]))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', playerIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach((p: any) => { nameMap[p.user_id] = p.display_name; });

      setChallenges(data.map((c: any) => ({
        ...c,
        challenger_name: nameMap[c.challenger_id] || 'שחקן',
        challenged_name: nameMap[c.challenged_id] || 'שחקן',
      })));
    }
  };

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('role', 'player')
      .eq('is_approved', true)
      .neq('user_id', playerId)
      .order('display_name');
    if (data) setPlayers(data);
  };

  useEffect(() => { fetchChallenges(); fetchPlayers(); }, [playerId]);

  const handleCreate = async () => {
    if (!form.challenged_id) { toast.error('יש לבחור שחקן'); return; }
    if (!form.description.trim()) { toast.error('יש להוסיף הסבר לאתגר'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('player_challenges').insert({
      challenger_id: playerId,
      challenged_id: form.challenged_id,
      zone: form.zone === 'all' ? null : form.zone,
      target_attempts: form.target_attempts,
      description: form.description.trim(),
    });
    if (error) toast.error('שגיאה ביצירת אתגר');
    else { toast.success('אתגר נשלח!'); setShowForm(false); setForm({ challenged_id: '', zone: 'all', target_attempts: 20, description: '' }); fetchChallenges(); }
    setSubmitting(false);
  };

  const handleSubmitScore = async (challengeId: string, attempts: number, made: number) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const isChallenger = challenge.challenger_id === playerId;
    const updateData = isChallenger
      ? { challenger_attempts: attempts, challenger_made: made }
      : { challenged_attempts: attempts, challenged_made: made };

    const otherAttempts = isChallenger ? challenge.challenged_attempts : challenge.challenger_attempts;
    const otherMade = isChallenger ? challenge.challenged_made : challenge.challenger_made;
    let finalUpdate: any = { ...updateData };

    if (otherAttempts > 0) {
      const myPct = attempts > 0 ? made / attempts : 0;
      const otherPct = otherAttempts > 0 ? otherMade / otherAttempts : 0;
      finalUpdate.status = 'completed';
      if (myPct > otherPct) finalUpdate.winner_id = playerId;
      else if (otherPct > myPct) finalUpdate.winner_id = isChallenger ? challenge.challenged_id : challenge.challenger_id;
      else finalUpdate.winner_id = null;
    } else {
      finalUpdate.status = 'active';
    }

    const { error } = await supabase.from('player_challenges').update(finalUpdate).eq('id', challengeId);
    if (error) toast.error('שגיאה בעדכון');
    else { toast.success('תוצאות עודכנו!'); fetchChallenges(); }
  };

  const handleAccept = async (id: string) => {
    const { error } = await supabase.from('player_challenges').update({ status: 'active' }).eq('id', id);
    if (error) toast.error('שגיאה');
    else { toast.success('אתגר התקבל!'); fetchChallenges(); }
  };

  const handleDecline = async (id: string) => {
    const { error } = await supabase.from('player_challenges').update({ status: 'declined' }).eq('id', id);
    if (error) toast.error('שגיאה');
    else { toast.info('אתגר נדחה'); fetchChallenges(); }
  };

  const getZoneLabel = (zone: string | null) => !zone ? 'כל האזורים' : ZONES.find(z => z.id === zone)?.label || zone;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center gap-1"><Clock className="h-3 w-3" />ממתין</span>;
      case 'active': return <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent flex items-center gap-1"><Swords className="h-3 w-3" />פעיל</span>;
      case 'completed': return <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" />הסתיים</span>;
      case 'declined': return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" />נדחה</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button size="sm" onClick={() => setShowForm(!showForm)} variant="outline" className="text-accent border-accent/30">
          <Swords className="ml-1 h-4 w-4" />
          אתגר חבר
        </Button>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span>אתגרים אישיים</span>
          <Swords className="h-5 w-5 text-accent" />
        </h2>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="gradient-card rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label className="text-right block">בחר חבר לאתגר</Label>
              <Select value={form.challenged_id} onValueChange={v => setForm({ ...form, challenged_id: v })}>
                <SelectTrigger><SelectValue placeholder="בחר שחקן" /></SelectTrigger>
                <SelectContent>
                  {players.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.display_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-right block">הסבר האתגר *</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder='לדוגמה: "מי שקולע יותר שלשות מהפינה הימנית מתוך 20 ניסיונות מנצח!"'
                className="text-right min-h-[80px]"
                maxLength={300}
              />
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
              <Label className="text-right block">מינימום ניסיונות</Label>
              <Input type="number" value={form.target_attempts} onChange={e => setForm({ ...form, target_attempts: Number(e.target.value) })} min={5} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={submitting} className="w-full gradient-accent text-accent-foreground">
            <Send className="ml-1 h-4 w-4" />
            {submitting ? 'שולח...' : 'שלח אתגר'}
          </Button>
        </div>
      )}

      {/* Challenges list */}
      {challenges.length === 0 ? (
        <div className="gradient-card rounded-xl p-6 text-center">
          <Swords className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">אין אתגרים פעילים. אתגר חבר!</p>
        </div>
      ) : (
        challenges.map(c => (
          <ChallengeMatchCard
            key={c.id}
            challenge={c}
            playerId={playerId}
            getZoneLabel={getZoneLabel}
            getStatusBadge={getStatusBadge}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onSubmitScore={handleSubmitScore}
          />
        ))
      )}
    </div>
  );
};

const ChallengeMatchCard = ({
  challenge, playerId, getZoneLabel, getStatusBadge, onAccept, onDecline, onSubmitScore
}: {
  challenge: PlayerChallenge; playerId: string;
  getZoneLabel: (z: string | null) => string;
  getStatusBadge: (s: string) => JSX.Element | null;
  onAccept: (id: string) => void; onDecline: (id: string) => void;
  onSubmitScore: (id: string, attempts: number, made: number) => void;
}) => {
  const [attempts, setAttempts] = useState('');
  const [made, setMade] = useState('');
  const isChallenger = challenge.challenger_id === playerId;
  const isChallenged = challenge.challenged_id === playerId;
  const myAttempts = isChallenger ? challenge.challenger_attempts : challenge.challenged_attempts;

  const challengerPct = challenge.challenger_attempts > 0 ? Math.round((challenge.challenger_made / challenge.challenger_attempts) * 100) : 0;
  const challengedPct = challenge.challenged_attempts > 0 ? Math.round((challenge.challenged_made / challenge.challenged_attempts) * 100) : 0;

  return (
    <div className="gradient-card rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        {getStatusBadge(challenge.status)}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{getZoneLabel(challenge.zone)} · מינימום {challenge.target_attempts} ניסיונות</p>
        </div>
      </div>

      {/* Challenge description */}
      {challenge.description && (
        <div className="rounded-lg bg-secondary/50 p-3 mb-3 border border-border/50">
          <p className="text-sm text-foreground text-right leading-relaxed">{challenge.description}</p>
        </div>
      )}

      {/* VS display */}
      <div className="flex items-center justify-between rounded-lg bg-secondary p-3 mb-3">
        <div className="text-center flex-1">
          <p className="text-sm font-medium text-foreground">{challenge.challenger_name}</p>
          {challenge.challenger_attempts > 0 ? (
            <p className={`text-lg font-bold ${challenge.winner_id === challenge.challenger_id ? 'text-success' : 'text-foreground'}`}>
              {challengerPct}% <span className="text-xs text-muted-foreground">({challenge.challenger_made}/{challenge.challenger_attempts})</span>
            </p>
          ) : <p className="text-xs text-muted-foreground">ממתין</p>}
        </div>
        <div className="px-4">
          <Swords className="h-6 w-6 text-accent" />
        </div>
        <div className="text-center flex-1">
          <p className="text-sm font-medium text-foreground">{challenge.challenged_name}</p>
          {challenge.challenged_attempts > 0 ? (
            <p className={`text-lg font-bold ${challenge.winner_id === challenge.challenged_id ? 'text-success' : 'text-foreground'}`}>
              {challengedPct}% <span className="text-xs text-muted-foreground">({challenge.challenged_made}/{challenge.challenged_attempts})</span>
            </p>
          ) : <p className="text-xs text-muted-foreground">ממתין</p>}
        </div>
      </div>

      {/* Winner */}
      {challenge.status === 'completed' && challenge.winner_id && (
        <div className="text-center mb-2">
          <span className="text-sm font-medium text-success">
            🏆 {challenge.winner_id === challenge.challenger_id ? challenge.challenger_name : challenge.challenged_name} ניצח/ה!
          </span>
        </div>
      )}
      {challenge.status === 'completed' && !challenge.winner_id && (
        <div className="text-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">תיקו! 🤝</span>
        </div>
      )}

      {/* Accept/Decline */}
      {challenge.status === 'pending' && isChallenged && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onDecline(challenge.id)} className="flex-1 text-destructive border-destructive/30">דחה</Button>
          <Button size="sm" onClick={() => onAccept(challenge.id)} className="flex-1 gradient-accent text-accent-foreground">קבל אתגר</Button>
        </div>
      )}

      {/* Submit score */}
      {challenge.status === 'active' && myAttempts === 0 && (
        <div className="flex gap-2 items-end">
          <Button size="sm" onClick={() => onSubmitScore(challenge.id, Number(attempts), Number(made))} disabled={!attempts || !made} className="gradient-accent text-accent-foreground shrink-0">שלח תוצאות</Button>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-right block">קלועות</Label>
            <Input type="number" min={0} value={made} onChange={e => setMade(e.target.value)} className="h-8 text-right" />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-right block">ניסיונות</Label>
            <Input type="number" min={1} value={attempts} onChange={e => setAttempts(e.target.value)} className="h-8 text-right" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerChallenges;
