import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ADMIN_EMAILS = ['itaiabrahams@gmail.com', 'idan.dank@gmail.com'];

const RoleSwitcher = () => {
  const { user, role, logout } = useAuth();
  const [switching, setSwitching] = useState(false);

  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return null;

  const targetRole = role === 'coach' ? 'player' : 'coach';

  const handleSwitch = async () => {
    if (!user) return;
    setSwitching(true);
    try {
      // Ensure target role exists in user_roles
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', targetRole)
        .maybeSingle();

      if (!existingRole) {
        await supabase.from('user_roles').insert({ user_id: user.id, role: targetRole });
      }

      // Update profile role
      const { error } = await supabase
        .from('profiles')
        .update({ role: targetRole })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`עובר למצב ${targetRole === 'coach' ? 'מאמן' : 'שחקן'}...`);
      // Reload to re-fetch profile
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error('Role switch error:', err);
      toast.error('שגיאה בהחלפת תפקיד');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Button
      onClick={handleSwitch}
      disabled={switching}
      size="sm"
      variant="outline"
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] left-4 z-[60] gap-2 rounded-full border-accent/50 bg-background/90 backdrop-blur-sm shadow-lg hover:bg-accent hover:text-accent-foreground"
    >
      <ArrowLeftRight className="h-4 w-4" />
      {switching ? 'מחליף...' : `עבור ל${targetRole === 'coach' ? 'מאמן' : 'שחקן'}`}
    </Button>
  );
};

export default RoleSwitcher;
