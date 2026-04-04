import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ADMIN_EMAILS = ['itaiabrahams@gmail.com', 'idan.dank@gmail.com'];

type RoleSwitcherProps = {
  inline?: boolean;
  className?: string;
};

const RoleSwitcher = ({ inline = false, className = '' }: RoleSwitcherProps) => {
  const { user, role } = useAuth();
  const [switching, setSwitching] = useState(false);

  const normalizedEmail = user?.email?.trim().toLowerCase();

  if (!normalizedEmail || !ADMIN_EMAILS.includes(normalizedEmail)) return null;

  const targetRole = role === 'coach' ? 'player' : 'coach';
  const buttonClassName = inline
    ? 'h-8 gap-1 rounded-full border-accent/50 bg-background/85 px-2 text-xs font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground'
    : 'fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] left-4 z-[60] gap-2 rounded-full border-accent/50 bg-background/90 backdrop-blur-sm shadow-lg hover:bg-accent hover:text-accent-foreground';

  const handleSwitch = async () => {
    if (!user) return;
    setSwitching(true);
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', targetRole)
        .maybeSingle();

      if (!existingRole) {
        await supabase.from('user_roles').insert({ user_id: user.id, role: targetRole });
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: targetRole })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`עובר למצב ${targetRole === 'coach' ? 'מאמן' : 'שחקן'}...`);
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
      className={`${buttonClassName} ${className}`.trim()}
      aria-label={`החלף למצב ${targetRole === 'coach' ? 'מאמן' : 'שחקן'}`}
    >
      <ArrowLeftRight className="h-4 w-4" />
      {switching ? 'מחליף...' : inline ? `ל${targetRole === 'coach' ? 'מאמן' : 'שחקן'}` : `עבור ל${targetRole === 'coach' ? 'מאמן' : 'שחקן'}`}
    </Button>
  );
};

export default RoleSwitcher;
