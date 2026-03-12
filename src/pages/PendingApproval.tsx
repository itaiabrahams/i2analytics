import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

const PendingApproval = () => {
  const { logout, profile, role } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
          <Clock className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">ממתין לאישור</h1>
        <p className="text-muted-foreground mb-2">
          שלום {profile?.display_name}, ההרשמה שלך כ{role === 'coach' ? 'מאמן' : 'שחקן'} התקבלה.
        </p>
        <p className="text-muted-foreground mb-6">
          המאמן הראשי צריך לאשר את הגישה שלך למערכת. תוכל להתחבר ברגע שתאושר.
        </p>
        <div className="gradient-card rounded-xl p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            💡 פנה למאמן הראשי כדי שיאשר את ההרשמה שלך
          </p>
        </div>
        <Button variant="ghost" onClick={logout} className="text-muted-foreground">
          <LogOut className="ml-2 h-4 w-4" />
          יציאה
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
