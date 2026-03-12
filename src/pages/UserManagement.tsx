import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Check, X, UserCheck, UserX, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PendingUser {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  team: string | null;
  position: string | null;
  is_approved: boolean;
  created_at: string;
}

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role, team, position, is_approved, created_at')
      .neq('user_id', user?.id ?? '')
      .order('created_at', { ascending: false });
    if (data) setUsers(data as PendingUser[]);
  };

  useEffect(() => { fetchUsers(); }, [user?.id]);

  const handleApprove = async (profileId: string, userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', profileId);
    if (error) {
      toast.error('שגיאה באישור המשתמש');
      return;
    }

    // Send notification
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'החשבון שלך אושר!',
      message: 'המאמן אישר את הגישה שלך למערכת. כעת תוכל להשתמש בכל הפיצ׳רים.',
      type: 'approval',
    });

    toast.success('המשתמש אושר בהצלחה!');
    fetchUsers();
  };

  const handleReject = async (profileId: string, userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: false })
      .eq('id', profileId);
    if (error) {
      toast.error('שגיאה בדחיית המשתמש');
      return;
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'הגישה שלך נדחתה',
      message: 'המאמן דחה את בקשת הגישה שלך למערכת. פנה למאמן לפרטים נוספים.',
      type: 'approval',
    });

    toast.success('המשתמש נדחה');
    fetchUsers();
  };

  const pending = users.filter(u => !u.is_approved);
  const approved = users.filter(u => u.is_approved);
  const displayed = tab === 'pending' ? pending : approved;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 text-muted-foreground">
          חזרה ללוח בקרה
          <ArrowRight className="mr-2 h-4 w-4" />
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {pending.length}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-accent" />
            ניהול משתמשים
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 justify-end">
          <Button
            variant={tab === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('approved')}
            className={tab === 'approved' ? 'gradient-accent text-accent-foreground' : 'text-muted-foreground'}
          >
            <UserCheck className="ml-1 h-4 w-4" />
            מאושרים ({approved.length})
          </Button>
          <Button
            variant={tab === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('pending')}
            className={tab === 'pending' ? 'gradient-accent text-accent-foreground' : 'text-muted-foreground'}
          >
            <Clock className="ml-1 h-4 w-4" />
            ממתינים ({pending.length})
          </Button>
        </div>

        {/* User list */}
        <div className="space-y-3">
          {displayed.length === 0 ? (
            <div className="gradient-card rounded-xl p-8 text-center">
              <p className="text-muted-foreground">
                {tab === 'pending' ? 'אין משתמשים ממתינים לאישור' : 'אין משתמשים מאושרים'}
              </p>
            </div>
          ) : (
            displayed.map(u => (
              <div key={u.id} className="gradient-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tab === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(u.id, u.user_id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(u.id, u.user_id)}
                        className="gradient-accent text-accent-foreground"
                      >
                        <Check className="ml-1 h-4 w-4" />
                        אשר
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(u.id, u.user_id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <UserX className="ml-1 h-4 w-4" />
                      בטל גישה
                    </Button>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      u.role === 'coach' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary-foreground'
                    }`}>
                      {u.role === 'coach' ? 'מאמן' : 'שחקן'}
                    </span>
                    <p className="font-medium text-foreground">{u.display_name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {u.position && `${u.position} · `}
                    {u.team && `${u.team} · `}
                    {new Date(u.created_at).toLocaleDateString('he-IL')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
