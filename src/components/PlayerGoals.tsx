import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Check, Clock, Trash2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  description: string;
  target_date: string | null;
  category: string;
  status: string;
  progress: number;
  progress_notes: string;
  created_at: string;
}

interface PlayerGoalsProps {
  playerId: string;
  isCoach: boolean;
}

const CATEGORIES = ['כללי', 'התקפה', 'הגנה', 'כושר גופני', 'טכניקה', 'מנטלי'];

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Check }> = {
  active: { label: 'פעיל', color: 'text-accent', icon: Clock },
  completed: { label: 'הושלם', color: 'text-success', icon: Check },
};

const PlayerGoals = ({ playerId, isCoach }: PlayerGoalsProps) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('כללי');

  // Progress update state
  const [newProgress, setNewProgress] = useState(0);
  const [progressNote, setProgressNote] = useState('');

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('player_goals')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setGoals(data as Goal[]);
  };

  useEffect(() => { fetchGoals(); }, [playerId]);

  const handleSave = async () => {
    if (!title || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('player_goals').insert({
        coach_id: user.id,
        player_id: playerId,
        title,
        description,
        target_date: targetDate || null,
        category,
      });
      if (error) throw error;
      toast.success('היעד נוסף בהצלחה!');
      setShowForm(false);
      setTitle('');
      setDescription('');
      setTargetDate('');
      setCategory('כללי');
      fetchGoals();
    } catch (err: any) {
      toast.error('שגיאה: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateProgress = async (goalId: string) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      const existingNotes = goal?.progress_notes || '';
      const dateStr = new Date().toLocaleDateString('he-IL');
      const updatedNotes = progressNote
        ? `${existingNotes}${existingNotes ? '\n' : ''}[${dateStr}] ${progressNote}`
        : existingNotes;

      const { error } = await supabase
        .from('player_goals')
        .update({
          progress: newProgress,
          progress_notes: updatedNotes,
          status: newProgress >= 100 ? 'completed' : 'active',
        })
        .eq('id', goalId);
      if (error) throw error;
      toast.success('ההתקדמות עודכנה!');
      setEditingProgress(null);
      setProgressNote('');
      fetchGoals();
    } catch (err: any) {
      toast.error('שגיאה: ' + err.message);
    }
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase.from('player_goals').delete().eq('id', goalId);
    if (error) {
      toast.error('שגיאה במחיקה');
      return;
    }
    fetchGoals();
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="gradient-card rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        {isCoach && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="text-accent"
          >
            <Plus className="ml-1 h-4 w-4" />
            {showForm ? 'ביטול' : 'יעד חדש'}
          </Button>
        )}
        <h3 className="font-semibold text-foreground text-right flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          יעדים ומטרות
        </h3>
      </div>

      {/* New goal form */}
      {showForm && isCoach && (
        <div className="bg-secondary rounded-lg p-4 mb-4 space-y-3">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="שם היעד"
            className="bg-muted border-border text-foreground text-right"
          />
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="תיאור היעד..."
            className="bg-muted border-border text-foreground text-right resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="bg-muted border-border text-foreground"
              min={new Date().toISOString().slice(0, 10)}
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSave}
            disabled={!title || saving}
            className="w-full gradient-accent text-accent-foreground"
          >
            {saving ? 'שומר...' : 'הוסף יעד'}
          </Button>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-2 mb-4">
          {activeGoals.map(goal => (
            <div key={goal.id} className="bg-secondary rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1">
                  {isCoach && (
                    <>
                      <button onClick={() => deleteGoal(goal.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (editingProgress === goal.id) {
                            setEditingProgress(null);
                          } else {
                            setEditingProgress(goal.id);
                            setNewProgress(goal.progress);
                            setProgressNote('');
                          }
                        }}
                        className="text-muted-foreground hover:text-accent transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <div className="text-right flex-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{goal.category}</span>
                    <p className="text-sm font-medium text-foreground">{goal.title}</p>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                  )}
                  {goal.target_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      יעד: {new Date(goal.target_date).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent">{goal.progress}%</span>
                <Progress value={goal.progress} className="flex-1 h-2" />
              </div>

              {/* Progress notes */}
              {goal.progress_notes && (
                <div className="bg-muted rounded-md p-2 mt-2">
                  <p className="text-xs text-muted-foreground text-right whitespace-pre-wrap">{goal.progress_notes}</p>
                </div>
              )}

              {/* Update progress */}
              {editingProgress === goal.id && isCoach && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-accent">{newProgress}%</span>
                    <span className="text-xs text-muted-foreground">עדכון התקדמות</span>
                  </div>
                  <Slider
                    value={[newProgress]}
                    onValueChange={([v]) => setNewProgress(v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <Input
                    value={progressNote}
                    onChange={e => setProgressNote(e.target.value)}
                    placeholder="הערה על ההתקדמות..."
                    className="bg-muted border-border text-foreground text-right text-sm"
                    onKeyDown={e => e.key === 'Enter' && updateProgress(goal.id)}
                  />
                  <Button
                    size="sm"
                    onClick={() => updateProgress(goal.id)}
                    className="w-full gradient-accent text-accent-foreground"
                  >
                    עדכן
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground text-right mb-2">יעדים שהושלמו ({completedGoals.length})</p>
          <div className="space-y-1">
            {completedGoals.map(goal => (
              <div key={goal.id} className="bg-secondary/50 rounded-lg p-2 flex items-center justify-between">
                <Check className="h-4 w-4 text-success" />
                <div className="text-right flex-1 mx-2">
                  <p className="text-sm text-muted-foreground line-through">{goal.title}</p>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{goal.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">אין יעדים עדיין</p>
      )}
    </div>
  );
};

export default PlayerGoals;
