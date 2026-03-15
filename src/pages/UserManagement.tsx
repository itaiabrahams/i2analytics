import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Check, X, UserCheck, UserX, Shield, Clock, CreditCard, Crown, Target } from 'lucide-react';
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
  subscription_tier: string;
  payment_status: string;
}

const TIER_LABELS: Record<string, string> = {
  free: 'חינם',
  basic: 'מעקב קליעות',
  premium: 'ליווי אישי',
};

const PAYMENT_LABELS: Record<string, string> = {
  active: 'שולם',
  pending: 'ממתין לתשלום',
  expired: 'פג תוקף',
};

const ADMIN_EMAILS = ['itaiabrahams@gmail.com', 'idan.dank@gmail.com'];

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">אין הרשאה</h1>
          <p className="text-muted-foreground mb-4">רק מנהלים יכולים לגשת לדף זה.</p>
          <Button variant="ghost" onClick={() => navigate('/')}>חזרה לדף הבית</Button>
        </div>
      </div>
    );
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, role, team, position, is_approved, created_at, subscription_tier, payment_status')
      .neq('user_id', user?.id ?? '')
      .order('created_at', { ascending: false });
    if (data) setUsers(data as PendingUser[]);
  };

  useEffect(() => { fetchUsers(); }, [user?.id]);

  const handleApprove = async (profileId: string, userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true, payment_status: 'active' })
      .eq('id', profileId);
    if (error) {
      toast.error('שגיאה באישור המשתמש');
      return;
    }

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

  const handleTogglePayment = async (profileId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'pending' : 'active';
    const { error } = await supabase
      .from('profiles')
      .update({ payment_status: newStatus })
      .eq('id', profileId);
    if (error) {
      toast.error('שגיאה בעדכון סטטוס תשלום');
      return;
    }
    toast.success(newStatus === 'active' ? 'תשלום אושר' : 'תשלום בוטל');
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
                <div className="flex items-center gap-2 flex-wrap">
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
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(u.id, u.user_id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <UserX className="ml-1 h-4 w-4" />
                        בטל גישה
                      </Button>
                      {u.role === 'player' && u.subscription_tier !== 'free' && (
                        <Button
                          size="sm"
                          variant={u.payment_status === 'active' ? 'outline' : 'default'}
                          onClick={() => handleTogglePayment(u.id, u.payment_status)}
                          className={u.payment_status === 'active' ? 'text-muted-foreground' : 'gradient-primary text-primary-foreground'}
                        >
                          <CreditCard className="ml-1 h-4 w-4" />
                          {u.payment_status === 'active' ? 'בטל תשלום' : 'אשר תשלום'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    {u.role === 'player' && u.subscription_tier !== 'free' && (
                      <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                        u.payment_status === 'active' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      }`}>
                        <CreditCard className="h-3 w-3" />
                        {PAYMENT_LABELS[u.payment_status] || u.payment_status}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                      u.subscription_tier === 'premium' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary-foreground'
                    }`}>
                      {u.subscription_tier === 'premium' ? <Crown className="h-3 w-3" /> : u.role === 'player' ? <Target className="h-3 w-3" /> : null}
                      {u.role === 'coach' ? 'מאמן' : TIER_LABELS[u.subscription_tier] || u.subscription_tier}
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
