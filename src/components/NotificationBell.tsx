import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`,
      }, () => fetchNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'עכשיו';
    if (diffMin < 60) return `לפני ${diffMin} דק׳`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `לפני ${diffHours} שע׳`;
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-card border-border p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-accent">
            סמן הכל כנקרא
          </Button>
          <h4 className="font-semibold text-foreground text-sm">התראות</h4>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">אין התראות</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 border-b border-border text-right transition-colors ${
                  !n.is_read ? 'bg-secondary/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(n.created_at)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-1 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
