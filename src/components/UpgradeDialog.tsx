import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, MessageCircle } from 'lucide-react';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  'ניתוח וידאו מקצועי של משחקים',
  'סשנים אישיים עם מאמן',
  'יעדים ומטרות מותאמים אישית',
  'דירוגים שבועיים מהמאמן',
  'פגישות וידאו עם המאמן',
  'משוב ממאמן הקבוצה',
];

const plans = [
  { name: 'סשן בודד', price: '350', period: 'לסשן', desc: 'סשן ניתוח וידאו בודד' },
  { name: 'מנוי חודשי', price: '1,500', period: 'לחודש', desc: '4-5 סשנים + ליווי מלא', popular: true },
  { name: 'מנוי עונתי', price: '1,250', period: 'לחודש', desc: 'עונה שלמה במחיר מוזל' },
];

const UpgradeDialog = ({ open, onOpenChange }: UpgradeDialogProps) => {
  const handleContact = () => {
    window.open('https://wa.me/972000000000?text=היי, אני מעוניין לשדרג לליווי אישי!', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-xl">
            <Crown className="h-6 w-6 text-accent" />
            שדרג לליווי אישי
          </DialogTitle>
        </DialogHeader>

        <p className="text-center text-muted-foreground text-sm">
          קח את המשחק שלך לשלב הבא עם ליווי מקצועי אישי
        </p>

        {/* Features */}
        <div className="space-y-2 my-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-accent shrink-0" />
              <span className="text-foreground">{f}</span>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border transition-all ${
                plan.popular
                  ? 'border-accent bg-accent/5 ring-1 ring-accent/20'
                  : 'border-border bg-secondary'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <span className="text-xl font-bold text-foreground">₪{plan.price}</span>
                  <span className="text-xs text-muted-foreground mr-1">/{plan.period}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground">{plan.name}</h4>
                    {plan.popular && (
                      <span className="text-[10px] font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                        פופולרי
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleContact}
          className="w-full gradient-accent text-accent-foreground mt-2 gap-2"
          size="lg"
        >
          <MessageCircle className="h-5 w-5" />
          צור קשר לשדרוג
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          לאחר התשלום, המאמן יאשר את השדרוג ותקבל גישה מלאה
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;
