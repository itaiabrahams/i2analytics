import { useParams, useNavigate } from 'react-router-dom';
import { store } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { GameAction, GameStats, Session, ACTION_TYPES } from '@/lib/types';

const NewSession = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const player = store.getPlayer(playerId!);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [opponent, setOpponent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [gameStats, setGameStats] = useState<GameStats>({
    points: 0, assists: 0, rebounds: 0, steals: 0, turnovers: 0, fgPercentage: 0,
  });
  const [actions, setActions] = useState<GameAction[]>([]);

  // New action form
  const [actionQuarter, setActionQuarter] = useState('1');
  const [actionMinute, setActionMinute] = useState('');
  const [actionScore, setActionScore] = useState<string>('1');
  const [actionType, setActionType] = useState('');
  const [actionDesc, setActionDesc] = useState('');

  if (!player) return <div className="p-8 text-center text-foreground">שחקן לא נמצא</div>;

  const overallScore = actions.length > 0
    ? (actions.reduce((s, a) => s + a.score, 0) / actions.length)
    : 0;

  const addAction = () => {
    if (!actionType || !actionDesc || !actionMinute) return;
    const newAction: GameAction = {
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

  const handleSave = () => {
    if (!opponent || !date) return;
    const session: Session = {
      id: `s-${Date.now()}`,
      playerId: playerId!,
      date,
      opponent,
      videoUrl,
      meetingUrl,
      coachNotes,
      actions,
      gameStats,
      overallScore: parseFloat(overallScore.toFixed(2)),
    };
    store.addSession(session);
    navigate(`/player/${playerId}`);
  };

  const updateStat = (key: keyof GameStats, val: string) => {
    setGameStats(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(`/player/${playerId}`)} className="mb-4 text-muted-foreground">
          חזרה לפרופיל
          <ArrowRight className="mr-2 h-4 w-4" />
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-6">סשן חדש עבור {player.name}</h1>

        {/* Session details */}
        <div className="gradient-card rounded-xl p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground text-right">פרטי המשחק</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-border text-foreground" />
            <Input placeholder="יריב" value={opponent} onChange={e => setOpponent(e.target.value)} className="bg-secondary border-border text-foreground text-right" />
          </div>
          <Input placeholder="קישור וידאו (YouTube / Google Drive)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="bg-secondary border-border text-foreground text-right" />
          <Input placeholder="קישור פגישת וידאו (Google Meet / Zoom)" value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} className="bg-secondary border-border text-foreground text-right" />
          <textarea
            placeholder="הערות מאמן"
            value={coachNotes}
            onChange={e => setCoachNotes(e.target.value)}
            className="w-full rounded-md bg-secondary border border-border text-foreground p-3 text-right min-h-[80px] resize-none"
          />
        </div>

        {/* Game stats */}
        <div className="gradient-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground text-right mb-4">סטטיסטיקות משחק</h2>
          <div className="grid grid-cols-3 gap-3">
            {([
              ['points', 'נקודות'],
              ['assists', 'אסיסטים'],
              ['rebounds', 'ריבאונדים'],
              ['steals', 'גניבות'],
              ['turnovers', 'טורנוברים'],
              ['fgPercentage', '% קליעה'],
            ] as [keyof GameStats, string][]).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground block text-right mb-1">{label}</label>
                <Input
                  type="number"
                  min={0}
                  value={gameStats[key]}
                  onChange={e => updateStat(key, e.target.value)}
                  className="bg-secondary border-border text-foreground text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="gradient-card rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <p className={`text-2xl font-bold ${overallScore > 0 ? 'text-success' : overallScore < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {overallScore.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">ציון כולל</p>
            </div>
            <h2 className="text-lg font-semibold text-foreground">פעולות ({actions.length})</h2>
          </div>

          {/* Add action form */}
          <div className="rounded-lg bg-secondary p-4 mb-4 space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <Select value={actionScore} onValueChange={setActionScore}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="1">+1</SelectItem>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="-1">-1</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" min={1} max={10} placeholder="דקה" value={actionMinute} onChange={e => setActionMinute(e.target.value)} className="bg-muted border-border text-foreground text-center" />
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

        <Button onClick={handleSave} disabled={!opponent} className="w-full gradient-accent text-accent-foreground h-12 text-lg font-semibold mb-8">
          שמור סשן
        </Button>
      </div>
    </div>
  );
};

export default NewSession;
