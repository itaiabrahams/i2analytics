import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ExternalLink, Pencil, Plus, Trash2, Save, X, CheckCircle2, Clock } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ACTION_TYPES } from '@/lib/types';
import VideoMeeting from '@/components/VideoMeeting';
import { useSession, usePlayer } from '@/hooks/useSupabaseData';
import { getLetterGrade, getGradeColor } from '@/lib/gradeUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocalAction {
  id: string;
  quarter: number;
  minute: number;
  score: number;
  description: string;
  type: string;
  isNew?: boolean;
}

const QUARTERS = [1, 2, 3, 4] as const;

const SessionDetail = () => {
  const { sessionId } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState<number | 'all'>('all');

  const { session, actions, loading, refetch } = useSession(sessionId);
  const { player } = usePlayer(session?.player_id);

  // Edit state
  const [editStats, setEditStats] = useState<Record<string, number>>({});
  const [editActions, setEditActions] = useState<LocalAction[]>([]);
  const [editNotes, setEditNotes] = useState('');

  // New action form
  const [actionQuarter, setActionQuarter] = useState('1');
  const [actionMinute, setActionMinute] = useState('');
  const [actionScore, setActionScore] = useState<string>('1');
  const [actionType, setActionType] = useState('');
  const [actionDesc, setActionDesc] = useState('');

  // Auto-enter edit mode for open sessions
  const [autoEditTriggered, setAutoEditTriggered] = useState(false);

  const sessionStatus = session ? ((session as any).status || 'completed') : 'completed';
  const isOpen = sessionStatus === 'open';
  const canEdit = session ? (auth.role === 'coach' || auth.playerId === session.player_id) : false;

  useEffect(() => {
    if (!session || !canEdit || editing || autoEditTriggered) return;
    if (isOpen && actions !== undefined) {
      setAutoEditTriggered(true);
      setEditStats({
        points: session.points,
        assists: session.assists,
        rebounds: session.rebounds,
        steals: session.steals,
        turnovers: session.turnovers,
        fgPercentage: session.fg_percentage,
      });
      setEditActions(actions.map(a => ({ ...a, isNew: false })));
      setEditNotes(session.coach_notes || '');
      setEditing(true);
    }
  }, [session, isOpen, canEdit, editing, autoEditTriggered, actions]);

  // Sync realtime changes into edit state when session/actions update from other user
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  useEffect(() => {
    if (!session || !editing) return;
    const sessionUpdatedAt = (session as any).updated_at || '';
    if (lastSyncedAt && sessionUpdatedAt !== lastSyncedAt) {
      setEditStats({
        points: session.points,
        assists: session.assists,
        rebounds: session.rebounds,
        steals: session.steals,
        turnovers: session.turnovers,
        fgPercentage: session.fg_percentage,
      });
      setEditNotes(session.coach_notes || '');
      setEditActions(actions.map(a => ({ ...a, isNew: false })));
      toast.info('הסשן עודכן על ידי משתמש אחר — הנתונים סונכרנו');
    }
    setLastSyncedAt(sessionUpdatedAt);
  }, [session, actions]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  }

  if (!session) return <div className="p-8 text-center text-foreground">סשן לא נמצא</div>;

  const startEditing = () => {
    setEditStats({
      points: session.points,
      assists: session.assists,
      rebounds: session.rebounds,
      steals: session.steals,
      turnovers: session.turnovers,
      fgPercentage: session.fg_percentage,
    });
    setEditActions(actions.map(a => ({ ...a, isNew: false })));
    setEditNotes(session.coach_notes || '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const overallScore = editing
    ? editActions.length > 0
      ? editActions.reduce((s, a) => s + a.score, 0) / editActions.length
      : 0
    : Number(session.overall_score);

  // --- Auto-save helpers ---
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestEditStats = useRef(editStats);
  const latestEditNotes = useRef(editNotes);
  const latestEditActions = useRef(editActions);
  latestEditStats.current = editStats;
  latestEditNotes.current = editNotes;
  latestEditActions.current = editActions;

  const autoSaveSession = useCallback(async () => {
    if (!session) return;
    const acts = latestEditActions.current;
    const newOverall = acts.length > 0
      ? acts.reduce((s, a) => s + a.score, 0) / acts.length
      : 0;
    const stats = latestEditStats.current;
    await supabase.from('sessions').update({
      points: stats.points,
      assists: stats.assists,
      rebounds: stats.rebounds,
      steals: stats.steals,
      turnovers: stats.turnovers,
      fg_percentage: stats.fgPercentage,
      overall_score: parseFloat(newOverall.toFixed(2)),
      coach_notes: latestEditNotes.current,
    } as any).eq('id', session.id);
  }, [session]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSaveSession(), 1500);
  }, [autoSaveSession]);

  // Auto-save when stats or notes change
  const [statsInitialized, setStatsInitialized] = useState(false);
  useEffect(() => {
    if (!editing || !session) return;
    if (!statsInitialized) { setStatsInitialized(true); return; }
    scheduleAutoSave();
  }, [editStats, editNotes]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, []);

  const addAction = async () => {
    if (!actionType || !actionDesc || !actionMinute || !session) return;
    const newAction: LocalAction = {
      id: `new-${Date.now()}`,
      quarter: parseInt(actionQuarter),
      minute: parseInt(actionMinute),
      score: parseInt(actionScore),
      description: actionDesc,
      type: actionType,
      isNew: true,
    };
    setEditActions(prev => [...prev, newAction].sort((a, b) => a.quarter - b.quarter || a.minute - b.minute));
    setActionDesc('');
    setActionMinute('');

    // Immediately save to DB
    const { data } = await supabase.from('game_actions').insert({
      session_id: session.id,
      quarter: newAction.quarter,
      minute: newAction.minute,
      score: newAction.score,
      description: newAction.description,
      type: newAction.type,
    }).select('id').single();

    if (data) {
      setEditActions(prev => prev.map(a => a.id === newAction.id ? { ...a, id: data.id, isNew: false } : a));
    }
    // Also save session stats
    autoSaveSession();
  };

  const removeAction = async (id: string) => {
    setEditActions(prev => prev.filter(a => a.id !== id));
    // Delete from DB immediately if it's a saved action
    if (!id.startsWith('new-')) {
      await supabase.from('game_actions').delete().eq('id', id);
    }
    // Update session stats
    autoSaveSession();
  };

  const handleSave = async (finishSession = false) => {
    setSaving(true);
    try {
      const newOverall = editActions.length > 0
        ? editActions.reduce((s, a) => s + a.score, 0) / editActions.length
        : 0;

      const updateData: any = {
        points: editStats.points,
        assists: editStats.assists,
        rebounds: editStats.rebounds,
        steals: editStats.steals,
        turnovers: editStats.turnovers,
        fg_percentage: editStats.fgPercentage,
        overall_score: parseFloat(newOverall.toFixed(2)),
        coach_notes: editNotes,
      };

      if (finishSession) {
        updateData.status = 'completed';
      }

      const { error: sessionError } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // Delete all existing actions
      const { error: deleteError } = await supabase
        .from('game_actions')
        .delete()
        .eq('session_id', session.id);

      if (deleteError) throw deleteError;

      // Re-insert all actions
      if (editActions.length > 0) {
        const actionsToInsert = editActions.map(a => ({
          session_id: session.id,
          quarter: a.quarter,
          minute: a.minute,
          score: a.score,
          description: a.description,
          type: a.type,
        }));

        const { error: insertError } = await supabase
          .from('game_actions')
          .insert(actionsToInsert);

        if (insertError) throw insertError;
      }

      if (finishSession) {
        toast.success('הסשן הושלם ונסגר בהצלחה! 🎉');
      } else {
        toast.success('הסשן נשמר — תוכל להמשיך מאוחר יותר');
      }
      setEditing(false);
      if (refetch) refetch();
    } catch (err: any) {
      toast.error('שגיאה בעדכון: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReopenSession = async () => {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'open' } as any)
      .eq('id', session.id);
    if (error) { toast.error('שגיאה'); return; }
    toast.success('הסשן נפתח מחדש');
    if (refetch) refetch();
  };

  const displayActions = editing ? editActions : actions;
  const plusActions = displayActions.filter(a => a.score === 1).length;
  const zeroActions = displayActions.filter(a => a.score === 0).length;
  const minusActions = displayActions.filter(a => a.score === -1).length;

  // Quarter filtering
  const quarterFilteredActions = activeQuarter === 'all'
    ? displayActions
    : displayActions.filter(a => a.quarter === activeQuarter);
  const filteredActions = filter === 'all' ? quarterFilteredActions : quarterFilteredActions.filter(a => a.type === filter);

  // Quarter stats
  const getQuarterStats = (q: number) => {
    const qa = displayActions.filter(a => a.quarter === q);
    const plus = qa.filter(a => a.score === 1).length;
    const minus = qa.filter(a => a.score === -1).length;
    const avg = qa.length > 0 ? qa.reduce((s, a) => s + a.score, 0) / qa.length : 0;
    return { total: qa.length, plus, minus, avg };
  };

  const backPath = auth.role === 'coach' ? `/player/${session.player_id}` : `/player/${auth.playerId}`;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
              isOpen ? 'bg-accent/20 text-accent' : 'bg-success/20 text-success'
            }`}>
              {isOpen ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              {isOpen ? 'סשן פתוח' : 'הושלם'}
            </span>

            {canEdit && !editing && !isOpen && (
              <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5">
                <Pencil className="h-4 w-4" />
                ערוך
              </Button>
            )}
            {canEdit && !isOpen && (
              <Button variant="outline" size="sm" onClick={handleReopenSession} className="gap-1.5 text-accent border-accent/30">
                <Clock className="h-4 w-4" />
                פתח מחדש
              </Button>
            )}
            {editing && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSave(false)} disabled={saving} className="gradient-accent text-accent-foreground gap-1.5">
                  <Save className="h-4 w-4" />
                  {saving ? 'שומר...' : 'שמור'}
                </Button>
                {isOpen && (
                  <Button size="sm" onClick={() => handleSave(true)} disabled={saving} className="bg-success hover:bg-success/90 text-success-foreground gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    סיים סשן
                  </Button>
                )}
                {!isOpen && (
                  <Button size="sm" variant="outline" onClick={cancelEditing} className="gap-1.5">
                    <X className="h-4 w-4" />
                    ביטול
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={() => navigate(backPath)} className="text-muted-foreground">
            חזרה לפרופיל
            <ArrowRight className="mr-2 h-4 w-4" />
          </Button>
        </div>

        {/* Open session banner */}
        {isOpen && (
          <div className="rounded-xl bg-accent/10 border border-accent/30 p-3 mb-4 text-center text-sm text-accent font-medium flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            סשן פתוח — ניתן להמשיך לעבוד עליו ולחזור מאוחר יותר. לחץ &quot;סיים סשן&quot; כשתסיים.
          </div>
        )}

        {editing && !isOpen && (
          <div className="rounded-xl bg-accent/10 border border-accent/30 p-3 mb-4 text-center text-sm text-accent font-medium">
            מצב עריכה — ניתן לעדכן סטטיסטיקות, ניקוד ופעולות
          </div>
        )}

        {/* Session header */}
        <div className="gradient-card rounded-xl p-6 mb-6 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="stat-glow rounded-xl bg-secondary p-4 text-center">
              <p className={`text-3xl font-bold ${overallScore > 0 ? 'text-success' : overallScore < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {overallScore.toFixed(2)}
              </p>
              <p className={`text-lg font-bold ${getGradeColor(getLetterGrade(overallScore))}`}>
                {getLetterGrade(overallScore)}
              </p>
              <p className="text-xs text-muted-foreground">ציון כולל</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-foreground">נגד {session.opponent}</h1>
              <p className="text-muted-foreground">{player?.display_name} · {new Date(session.date).toLocaleDateString('he-IL')}</p>
              {session.video_url && (
                <a href={session.video_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  צפייה בוידאו
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quarter tabs */}
        <div className="gradient-card rounded-xl p-4 mb-6">
          <h3 className="text-right font-semibold text-foreground mb-3">ניתוח לפי רבעים</h3>
          <div className="flex gap-2 justify-end flex-wrap mb-3">
            <button
              onClick={() => setActiveQuarter('all')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeQuarter === 'all' ? 'gradient-accent text-accent-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              הכל
            </button>
            {QUARTERS.map(q => {
              const stats = getQuarterStats(q);
              return (
                <button
                  key={q}
                  onClick={() => setActiveQuarter(q)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeQuarter === q ? 'gradient-accent text-accent-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Q{q}
                  {stats.total > 0 && (
                    <span className="mr-1 text-[10px] opacity-75">({stats.total})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quarter summary cards */}
          <div className="grid grid-cols-4 gap-2">
            {QUARTERS.map(q => {
              const stats = getQuarterStats(q);
              return (
                <button
                  key={q}
                  onClick={() => setActiveQuarter(q)}
                  className={`rounded-xl p-3 text-center transition-all ${
                    activeQuarter === q ? 'ring-2 ring-accent bg-accent/10' : 'bg-secondary'
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">רבע {q}</p>
                  <p className={`text-lg font-bold ${stats.avg > 0 ? 'text-success' : stats.avg < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {stats.total > 0 ? stats.avg.toFixed(2) : '—'}
                  </p>
                  <div className="flex justify-center gap-2 mt-1">
                    <span className="text-[10px] text-success">+{stats.plus}</span>
                    <span className="text-[10px] text-destructive">-{stats.minus}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Distribution + Game stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="gradient-card rounded-xl p-4">
            <h3 className="mb-3 text-right font-semibold text-foreground">
              התפלגות פעולות {activeQuarter !== 'all' ? `(Q${activeQuarter})` : ''}
            </h3>
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">
                  {activeQuarter === 'all' ? minusActions : quarterFilteredActions.filter(a => a.score === -1).length}
                </p>
                <p className="text-sm text-muted-foreground">-1</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">
                  {activeQuarter === 'all' ? zeroActions : quarterFilteredActions.filter(a => a.score === 0).length}
                </p>
                <p className="text-sm text-muted-foreground">0</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-success">
                  {activeQuarter === 'all' ? plusActions : quarterFilteredActions.filter(a => a.score === 1).length}
                </p>
                <p className="text-sm text-muted-foreground">+1</p>
              </div>
            </div>
          </div>
          <div className="gradient-card rounded-xl p-4">
            <h3 className="mb-3 text-right font-semibold text-foreground">סטטיסטיקות משחק</h3>
            {editing ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                {([
                  ['points', 'נקודות'],
                  ['assists', 'אסיסטים'],
                  ['rebounds', 'ריבאונדים'],
                  ['steals', 'גניבות'],
                  ['turnovers', 'טורנוברים'],
                  ['fgPercentage', '% קליעה'],
                ] as [string, string][]).map(([key, label]) => (
                  <div key={key} className="rounded-lg bg-secondary p-2">
                    <Input
                      type="number"
                      min={0}
                      value={editStats[key]}
                      onChange={e => setEditStats(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                      className="bg-muted border-border text-foreground text-center h-8 text-lg font-bold"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'נקודות', value: session.points },
                  { label: 'אסיסטים', value: session.assists },
                  { label: 'ריבאונדים', value: session.rebounds },
                  { label: 'גניבות', value: session.steals },
                  { label: 'טורנוברים', value: session.turnovers },
                  { label: '% קליעה', value: `${session.fg_percentage}%` },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg bg-secondary p-2">
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video meeting */}
        <VideoMeeting meetingUrl={session.meeting_url} />

        {/* Coach notes */}
        {(session.coach_notes || editing) && (
          <div className="gradient-card rounded-xl p-4 mb-6">
            <h3 className="mb-2 text-right font-semibold text-foreground">הערות מאמן</h3>
            {editing ? (
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                className="w-full rounded-md bg-secondary border border-border text-foreground p-3 text-right min-h-[80px] resize-none"
                placeholder="הוסף הערות..."
              />
            ) : (
              <p className="text-right text-muted-foreground">{session.coach_notes}</p>
            )}
          </div>
        )}

        {/* Actions log */}
        <div className="gradient-card rounded-xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {filteredActions.length} פעולות
              {activeQuarter !== 'all' && ` (Q${activeQuarter})`}
            </span>
            <h3 className="font-semibold text-foreground">יומן פעולות</h3>
          </div>

          {/* Add action form (edit mode) */}
          {editing && (
            <div className="rounded-lg bg-secondary p-4 mb-4 space-y-3">
              <p className="text-sm text-muted-foreground text-right font-medium">הוסף פעולה חדשה</p>
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
          )}

          {/* Filter */}
          <div className="mb-4 flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${filter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              הכל
            </button>
            {ACTION_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${filter === type ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredActions.map((action, i) => (
              <div
                key={action.id}
                className="flex items-center justify-between rounded-lg bg-secondary p-3 animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center gap-2">
                  {editing && (
                    <button onClick={() => removeAction(action.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                    action.score === 1 ? 'bg-success/20 text-success' :
                    action.score === -1 ? 'bg-destructive/20 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {action.score > 0 ? '+1' : action.score === 0 ? '0' : '-1'}
                  </span>
                </div>
                <div className="flex-1 text-right mx-3">
                  <p className="text-sm text-foreground">{action.description}</p>
                  <p className="text-xs text-muted-foreground">{action.type}</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Q{action.quarter} · {action.minute}'
                </span>
              </div>
            ))}
            {filteredActions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">אין פעולות</p>
            )}
          </div>
        </div>

        {/* Bottom action bar for open sessions */}
        {isOpen && editing && (
          <div className="sticky bottom-4 mt-6 flex gap-3">
            <Button
              onClick={() => handleSave(false)}
              disabled={saving}
              variant="outline"
              className="flex-1 h-12 text-foreground border-border font-semibold"
            >
              <Save className="ml-2 h-4 w-4" />
              שמור והמשך מאוחר יותר
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 h-12 bg-success hover:bg-success/90 text-success-foreground font-semibold text-lg"
            >
              <CheckCircle2 className="ml-2 h-5 w-5" />
              סיים סשן
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetail;
