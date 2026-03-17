import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, MessageCircle } from 'lucide-react';

const PendingApproval = () => {
  const { logout, profile, role } = useAuth();
  const isPremium = profile?.subscription_tier === 'premium';

  const handleWhatsApp = () => {
    const name = profile?.display_name || '';
    window.open(
      `https://wa.me/972526124759?text=${encodeURIComponent(`היי, נרשמתי לליווי אישי באפליקציה ואשמח לתאם שיחת היכרות! השם שלי: ${name}`)}`,
      '_blank'
    );
  };

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

        {isPremium ? (
          <>
            <p className="text-muted-foreground mb-4">
              לפני שנתחיל בליווי האישי, צריך לקיים שיחת היכרות ותכנון קצרה. 
              שלח הודעה בווצאפ ונתאם שיחה בהקדם!
            </p>
            <div className="gradient-card rounded-xl p-4 mb-4">
              <p className="text-sm text-foreground font-medium mb-1">📞 למה שיחת היכרות?</p>
              <p className="text-sm text-muted-foreground">
                כדי להכיר אותך, להבין את היעדים שלך ולבנות תוכנית ליווי מותאמת אישית. 
                רק לאחר השיחה נפעיל את הגישה המלאה לאפליקציה.
              </p>
            </div>
            <Button
              onClick={handleWhatsApp}
              className="w-full gradient-accent text-accent-foreground mb-4 gap-2"
              size="lg"
            >
              <MessageCircle className="h-5 w-5" />
              שלח הודעה בווצאפ
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              המאמן הראשי צריך לאשר את הגישה שלך למערכת. תוכל להתחבר ברגע שתאושר.
            </p>
            <div className="gradient-card rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                💡 פנה למאמן הראשי כדי שיאשר את ההרשמה שלך
              </p>
            </div>
          </>
        )}

        <Button variant="ghost" onClick={logout} className="text-muted-foreground">
          <LogOut className="ml-2 h-4 w-4" />
          יציאה
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
