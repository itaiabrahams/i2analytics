import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Plus, Trash2, Video, BarChart3, ListChecks, Check } from 'lucide-react';
import { useState } from 'react';
import { ACTION_TYPES } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

interface LocalAction {
  id: string;
  quarter: number;
  minute: number;
  score: 1 | 0 | -1;
  description: string;
  type: string;
}

const STEPS = [
  { label: 'פרטי משחק', icon: Video, description: 'תאריך, יריב וקישור וידאו' },
  { label: 'סטטיסטיקות', icon: BarChart3, description: 'נתוני המשחק' },
  { label: 'יומן פעולות', icon: ListChecks, description: 'ניקוד וניתוח פעולות' },
];

const NewSession = () => {
  const { playerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { player, loading } = usePlayer(playerId);

  // Check for pre-filled data from a scheduled meeting
  const searchParams = new URLSearchParams(window.location.search);
  const meetingId = searchParams.get('meetingId');
  const meetingTitle = searchParams.get('title');

  const [step, setStep] = useState(0);
  const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().slice(0, 10));
  const [opponent, setOpponent] = useState(meetingTitle || '');
  const [videoUrl, setVideoUrl] = useState(searchParams.get('videoUrl') || '');
  const [meetingUrl, setMeetingUrl] = useState(searchParams.get('meetingUrl') || '');
  const [coachNotes, setCoachNotes] = useState(searchParams.get('notes') || '');
  const [gameStats, setGameStats] = useState({
    points: 0, assists: 0, rebounds: 0, steals: 0, turnovers: 0, fgPercentage: 0,
  });
  const [actions, setActions] = useState<LocalAction[]>([]);
  const [saving, setSaving] = useState(false);

  const [actionQuarter, setActionQuarter] = useState('1');
  const [actionMinute, setActionMinute] = useState('');
  const [actionScore, setActionScore] = useState<string>('1');
  const [actionType, setActionType] = useState('');
  const [actionDesc, setActionDesc] = useState('');

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  if (!player) return <div className="p-8 text-center text-foreground">שחקן לא נמצא</div>;

  const overallScore = actions.length > 0
    ? (actions.reduce((s, a) => s + a.score, 0) / actions.length)
    : 0;

  const addAction = () => {
    if (!actionType || !actionDesc || !actionMinute) return;
    const newAction: LocalAction = {
      id: `new-${Date.now()}`,
      quarter: parseInt(actionQuarter),
      minute: parseInt(actionMinute),
      score: parseInt(actionScore) as 1 | 0 | -1,
      description: actionDesc,
      type: actionType,
    };
    setActions(prev => [...prev, newAction].sort((a, b) => a.quarter - b.quarter || a.minute - b.minute));
    setActionDesc('');
    setActionMinute('');
  };

  const removeAction = (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    if (!opponent || !date || !user) return;
    setSaving(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          player_id: playerId!,
          coach_id: user.id,
          date,
          opponent,
          video_url: videoUrl,
          meeting_url: meetingUrl,
          coach_notes: coachNotes,
          points: gameStats.points,
          assists: gameStats.assists,
          rebounds: gameStats.rebounds,
          steals: gameStats.steals,
          turnovers: gameStats.turnovers,
          fg_percentage: gameStats.fgPercentage,
          overall_score: parseFloat(overallScore.toFixed(2)),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      if (actions.length > 0) {
        const actionsToInsert = actions.map(a => ({
          session_id: sessionData.id,
          quarter: a.quarter,
          minute: a.minute,
          score: a.score,
          description: a.description,
          type: a.type,
        }));

        const { error: actionsError } = await supabase
          .from('game_actions')
          .insert(actionsToInsert);

        if (actionsError) throw actionsError;
      }

      // If created from a scheduled meeting, mark it as completed
      if (meetingId) {
        await supabase
          .from('scheduled_meetings')
          .update({ status: 'completed' })
          .eq('id', meetingId);
      }

      toast.success('הסשן נשמר בהצלחה!');
      navigate(`/player/${playerId}`);
    } catch (err: any) {
      toast.error('שגיאה בשמירת הסשן: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStat = (key: string, val: string) => {
    setGameStats(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };

  const canAdvanceFromStep0 = opponent.trim().length > 0 && date.length > 0;

  const nextStep = () => {
    if (step === 0 && !canAdvanceFromStep0) {
      toast.error('יש למלא תאריך ויריב');
      return;
    }
    setStep(s => Math.min(s + 1, 2));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(`/player/${playerId}`)} className="mb-4 text-muted-foreground">
          חזרה לפרופיל
          <ArrowRight className="mr-2 h-4 w-4" />
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-2">סשן חדש עבור {player.display_name}</h1>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 gradient-card rounded-xl p-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={i}
                onClick={() => { if (i < step) setStep(i); }}
                className={`flex flex-col items-center gap-1 flex-1 transition-all ${
                  isActive ? 'scale-105' : isDone ? 'cursor-pointer opacity-80 hover:opacity-100' : 'opacity-40'
                }`}
                disabled={i > step}
              >
                <div className={`rounded-full p-2.5 transition-all ${
                  isActive ? 'gradient-accent shadow-lg' :
                  isDone ? 'bg-success/20' : 'bg-muted'
                }`}>
                  {isDone ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <Icon className={`h-5 w-5 ${isActive ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                <span className="text-[10px] text-muted-foreground hidden md:block">{s.description}</span>
              </button>
            );
          })}
        </div>

        {/* Step 0: Game details + video */}
        {step === 0 && (
          <div className="gradient-card rounded-xl p-6 mb-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-semibold text-foreground text-right flex items-center justify-end gap-2">
              <span>פרטי המשחק</span>
              <Video className="h-5 w-5 text-accent" />
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-border text-foreground" />
              <Input placeholder="יריב *" value={opponent} onChange={e => setOpponent(e.target.value)} className="bg-secondary border-border text-foreground text-right" />
            </div>
            <Input placeholder="קישור וידאו (YouTube / Google Drive)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="bg-secondary border-border text-foreground text-right" />
            <Input placeholder="קישור פגישת וידאו (Google Meet / Zoom)" value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} className="bg-secondary border-border text-foreground text-right" />
            <textarea
              placeholder="הערות מאמן"
              value={coachNotes}
              onChange={e => setCoachNotes(e.target.value)}
              className="w-full rounded-md bg-secondary border border-border text-foreground p-3 text-right min-h-[80px] resize-none"
            />

            {videoUrl && (
              <div className="rounded-lg bg-secondary/50 border border-accent/30 p-3 flex items-center justify-end gap-2">
                <span className="text-sm text-accent">קישור וידאו מצורף ✓</span>
                <Video className="h-4 w-4 text-accent" />
              </div>
            )}
          </div>
        )}

        {/* Step 1: Game stats */}
        {step === 1 && (
          <div className="gradient-card rounded-xl p-6 mb-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-semibold text-foreground text-right mb-4 flex items-center justify-end gap-2">
              <span>סטטיסטיקות משחק</span>
              <BarChart3 className="h-5 w-5 text-accent" />
            </h2>
            <p className="text-sm text-muted-foreground text-right mb-4">
              מלא את הנתונים תוך כדי צפייה בסרטון המשחק
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([
                ['points', 'נקודות'],
                ['assists', 'אסיסטים'],
                ['rebounds', 'ריבאונדים'],
                ['steals', 'גניבות'],
                ['turnovers', 'טורנוברים'],
                ['fgPercentage', '% קליעה'],
              ] as [string, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground block text-right mb-1">{label}</label>
                  <Input
                    type="number"
                    min={0}
                    value={(gameStats as any)[key]}
                    onChange={e => updateStat(key, e.target.value)}
                    className="bg-secondary border-border text-foreground text-center"
                  />
                </div>
              ))}
            </div>

            {/* Video link reminder */}
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-lg bg-accent/10 border border-accent/30 p-3 text-center text-sm text-accent hover:bg-accent/20 transition-colors"
              >
                📹 פתח סרטון משחק בחלון חדש
              </a>
            )}
          </div>
        )}

        {/* Step 2: Actions */}
        {step === 2 && (
          <div className="gradient-card rounded-xl p-6 mb-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className={`text-2xl font-bold ${overallScore > 0 ? 'text-success' : overallScore < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {overallScore.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">ציון כולל</p>
              </div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-accent" />
                פעולות ({actions.length})
              </h2>
            </div>

            <p className="text-sm text-muted-foreground text-right mb-3">
              צפו יחד בסרטון ונקדו את הפעולות
            </p>

            {/* Video link reminder */}
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 block rounded-lg bg-accent/10 border border-accent/30 p-3 text-center text-sm text-accent hover:bg-accent/20 transition-colors"
              >
                📹 פתח סרטון משחק בחלון חדש
              </a>
            )}

            {/* Add action form */}
            <div className="rounded-lg bg-secondary p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="סוג" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {ACTION_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={actionQuarter} onValueChange={setActionQuarter}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="1">רבע 1</SelectItem>
                    <SelectItem value="2">רבע 2</SelectItem>
                    <SelectItem value="3">רבע 3</SelectItem>
                    <SelectItem value="4">רבע 4</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={1} max={10} placeholder="דקה" value={actionMinute} onChange={e => setActionMinute(e.target.value)} className="bg-muted border-border text-foreground text-center" />
                <Select value={actionScore} onValueChange={setActionScore}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="1">+1 ✅</SelectItem>
                    <SelectItem value="0">0 ➖</SelectItem>
                    <SelectItem value="-1">-1 ❌</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={addAction} size="sm" className="gradient-accent text-accent-foreground">
                  <Plus className="ml-1 h-4 w-4" />
                  הוסף
                </Button>
                <Input placeholder="תיאור הפעולה" value={actionDesc} onChange={e => setActionDesc(e.target.value)} className="flex-1 bg-muted border-border text-foreground text-right" onKeyDown={e => e.key === 'Enter' && addAction()} />
              </div>
            </div>

            {/* Actions list */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {actions.map(action => (
                <div key={action.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeAction(action.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      action.score === 1 ? 'bg-success/20 text-success' :
                      action.score === -1 ? 'bg-destructive/20 text-destructive' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {action.score > 0 ? '+1' : action.score === 0 ? '0' : '-1'}
                    </span>
                  </div>
                  <div className="flex-1 text-right mx-3">
                    <p className="text-sm text-foreground">{action.description}</p>
                    <p className="text-xs text-muted-foreground">{action.type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Q{action.quarter} · {action.minute}'</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mb-8">
          {step > 0 && (
            <Button variant="outline" onClick={prevStep} className="flex-1 h-12 text-foreground border-border">
              <ArrowRight className="ml-2 h-4 w-4" />
              {STEPS[step - 1].label}
            </Button>
          )}
          
          {step < 2 ? (
            <Button onClick={nextStep} className="flex-1 gradient-accent text-accent-foreground h-12 text-lg font-semibold">
              {STEPS[step + 1].label}
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!opponent || saving} className="flex-1 gradient-accent text-accent-foreground h-12 text-lg font-semibold">
              {saving ? 'שומר...' : '✓ שמור סשן'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSession;
