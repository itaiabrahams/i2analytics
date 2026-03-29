import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Plus, Video, Calendar, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Session {
  id: string;
  date: string;
  opponent: string;
  overall_score: number;
  points: number;
  assists: number;
  rebounds: number;
  video_url?: string;
  coach_id: string;
}

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  meeting_url?: string;
  status: string;
  notes?: string;
}

const PersonalCoachingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New session form
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [opponent, setOpponent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [coachNotes, setCoachNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: sessData }, { data: meetData }] = await Promise.all([
        supabase
          .from('sessions')
          .select('id, date, opponent, overall_score, points, assists, rebounds, video_url, coach_id')
          .eq('player_id', user.id)
          .order('date', { ascending: false })
          .limit(50),
        supabase
          .from('scheduled_meetings')
          .select('id, title, scheduled_at, meeting_url, status, notes')
          .eq('player_id', user.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(10),
      ]);
      setSessions(sessData || []);
      setMeetings(meetData || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleCreateSession = async () => {
    if (!opponent || !date || !user) return;
    setSaving(true);
    try {
      // Get the player's assigned coach
      const { data: profile } = await supabase
        .from('profiles')
        .select('coach_id')
        .eq('user_id', user.id)
        .single();
      const assignedCoachId = profile?.coach_id || user.id;

      // Check if a session already exists for this player+date+opponent
      const { data: existingSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('player_id', user.id)
        .eq('date', date)
        .eq('opponent', opponent)
        .limit(1);

      let targetSessionId: string;

      if (existingSessions && existingSessions.length > 0) {
        // Session already exists — navigate to it instead of creating a duplicate
        targetSessionId = existingSessions[0].id;
        toast.success('נמצא סשן קיים למשחק הזה, מעביר אליו...');
      } else {
        const { data, error } = await supabase
          .from('sessions')
          .insert({
            player_id: user.id,
            coach_id: assignedCoachId,
            date,
            opponent,
            video_url: videoUrl || '',
            coach_notes: coachNotes || '',
            points: 0,
            assists: 0,
            rebounds: 0,
            steals: 0,
            turnovers: 0,
            fg_percentage: 0,
            overall_score: 0,
          })
          .select()
          .single();

        if (error) throw error;
        targetSessionId = data.id;
        toast.success('סשן חדש נוצר!');
      }

      setNewSessionOpen(false);
      setOpponent('');
      setVideoUrl('');
      setCoachNotes('');
      navigate(`/session/${targetSessionId}`);
    } catch (err: any) {
      toast.error('שגיאה: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const avgScore = sessions.length > 0
    ? (sessions.reduce((s, sess) => s + Number(sess.overall_score), 0) / sessions.length).toFixed(2)
    : '—';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 justify-end">
                <span>ליווי אישי</span>
                <Video className="h-6 w-6 text-accent" />
              </h1>
              <p className="text-sm text-muted-foreground">סשנים, פגישות וניתוח ביצועים</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-accent/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-accent">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">סשנים</p>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-accent">{avgScore}</p>
              <p className="text-xs text-muted-foreground">ציון ממוצע</p>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-accent">{meetings.length}</p>
              <p className="text-xs text-muted-foreground">פגישות קרובות</p>
            </CardContent>
          </Card>
        </div>

        {/* New Session Button */}
        <Dialog open={newSessionOpen} onOpenChange={setNewSessionOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gradient-accent text-accent-foreground font-bold gap-2">
              <Plus className="h-5 w-5" />
              סשן חדש
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>יצירת סשן חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>תאריך</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <Label>יריב / נושא</Label>
                <Input
                  placeholder="למשל: מכבי חיפה, אימון אישי..."
                  value={opponent}
                  onChange={e => setOpponent(e.target.value)}
                />
              </div>
              <div>
                <Label>קישור וידאו (אופציונלי)</Label>
                <Input
                  placeholder="YouTube / Google Drive"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                />
              </div>
              <div>
                <Label>הערות</Label>
                <Textarea
                  placeholder="הערות לסשן..."
                  value={coachNotes}
                  onChange={e => setCoachNotes(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreateSession}
                disabled={!opponent || saving}
                className="w-full gradient-accent text-accent-foreground"
              >
                {saving ? 'שומר...' : 'צור סשן והמשך לניקוד'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upcoming Meetings */}
        {meetings.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                פגישות קרובות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {meetings.map(m => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50"
                >
                  <div className="flex items-center gap-2">
                    {m.meeting_url && (
                      <a href={m.meeting_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1 text-xs">
                          <Video className="h-3 w-3" />
                          הצטרף
                        </Button>
                      </a>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {m.status === 'scheduled' ? 'מתוכנן' : m.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline ml-1" />
                      {format(new Date(m.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Sessions History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              היסטוריית סשנים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                עדיין אין סשנים. צור סשן חדש כדי להתחיל!
              </p>
            ) : (
              sessions.map(sess => (
                <button
                  key={sess.id}
                  onClick={() => navigate(`/session/${sess.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 hover:border-accent/30 transition-all text-right"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-xs ${
                        Number(sess.overall_score) > 0.3
                          ? 'bg-success/20 text-success'
                          : Number(sess.overall_score) < -0.2
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {Number(sess.overall_score).toFixed(2)}
                    </Badge>
                    {sess.video_url && <Video className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{sess.opponent}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sess.date), 'dd/MM/yyyy')}
                      {' · '}
                      {sess.points} נק׳ · {sess.assists} אס׳ · {sess.rebounds} ריב׳
                    </p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PersonalCoachingPage;
