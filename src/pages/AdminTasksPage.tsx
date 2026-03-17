import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAILS = ['itaiabrahams@gmail.com', 'idan.dank@gmail.com'];

type AssignedTo = 'itai' | 'idan' | 'both';

interface AdminTask {
  id: string;
  content: string;
  is_done: boolean;
  assigned_to: AssignedTo;
  created_at: string;
}

const ASSIGN_LABELS: Record<AssignedTo, string> = {
  itai: 'איתי',
  idan: 'עידן',
  both: 'שניהם',
};

const ASSIGN_COLORS: Record<AssignedTo, string> = {
  itai: 'bg-primary/20 text-primary-foreground',
  idan: 'bg-accent/20 text-accent',
  both: 'bg-secondary text-foreground',
};

const AdminTasksPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('admin_tasks')
      .select('*')
      .order('is_done', { ascending: true })
      .order('created_at', { ascending: false });
    if (data) setTasks(data as AdminTask[]);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async () => {
    if (!newTask.trim() || !user) return;
    const { error } = await supabase.from('admin_tasks').insert({ content: newTask.trim(), created_by: user.id, assigned_to: 'both' });
    if (error) { toast.error('שגיאה בהוספת משימה'); return; }
    setNewTask('');
    toast.success('משימה נוספה');
    fetchTasks();
  };

  const cycleAssignment = async (task: AdminTask) => {
    const order: AssignedTo[] = ['both', 'itai', 'idan'];
    const nextIdx = (order.indexOf(task.assigned_to) + 1) % order.length;
    const newAssign = order[nextIdx];
    await supabase.from('admin_tasks').update({ assigned_to: newAssign } as any).eq('id', task.id);
    fetchTasks();
  };

  const toggleTask = async (id: string, currentDone: boolean, assignedTo: AssignedTo) => {
    if (assignedTo === 'both') {
      toast.error('קודם בחר למי המשימה (איתי / עידן / שניהם)');
      return;
    }
    await supabase.from('admin_tasks').update({ is_done: !currentDone }).eq('id', id);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('admin_tasks').delete().eq('id', id);
    toast.success('משימה נמחקה');
    fetchTasks();
  };

  if (!isAdmin) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">אין גישה</p></div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">📋 משימות</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <Textarea
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="כתוב משימה חדשה..."
            className="min-h-[60px] resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTask(); } }}
          />
          <Button onClick={addTask} disabled={!newTask.trim()} className="gradient-accent text-accent-foreground self-end">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center">טוען...</p>
        ) : tasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">אין משימות עדיין 🎉</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <Card key={task.id} className={`transition-all ${task.is_done ? 'opacity-60' : ''}`}>
                <CardContent className="flex items-start gap-3 p-4">
                  <button onClick={() => toggleTask(task.id, task.is_done, task.assigned_to)} className="mt-0.5 shrink-0">
                    {task.is_done
                      ? <CheckCircle2 className="h-5 w-5 text-success" />
                      : <Circle className="h-5 w-5 text-muted-foreground" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm whitespace-pre-wrap ${task.is_done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.content}
                    </p>
                    <button
                      onClick={() => cycleAssignment(task)}
                      className={`mt-2 text-xs px-3 py-1 rounded-full font-medium transition-colors ${ASSIGN_COLORS[task.assigned_to]}`}
                    >
                      {ASSIGN_LABELS[task.assigned_to]}
                    </button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="shrink-0 text-destructive hover:text-destructive h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTasksPage;
