import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Download, Users, Copy } from 'lucide-react';
import { toast } from 'sonner';

const LEAGUE_CODE = '171640-WXKD2';
const APP_STORE_LINK = 'https://apps.apple.com/il/app/euroleague-fantasy-challenge/id1581590467?l=he';
const WHATSAPP_LINK = 'https://chat.whatsapp.com/CcDosZDAL7OBReZ2ZR7gJV?mode=gi_t';

interface FantasyInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FantasyInfoDialog = ({ open, onOpenChange }: FantasyInfoDialogProps) => {
  const copyCode = () => {
    navigator.clipboard.writeText(LEAGUE_CODE);
    toast.success('הקוד הועתק!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2 justify-end">
            🏆 פנטזי יורוליג - ליגת I2
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Step 1 */}
          <div className="gradient-card rounded-xl p-4 border border-accent/20">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2 justify-end">
              הורידו את האפליקציה
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-black">1</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              הורידו את אפליקציית EuroLeague Fantasy Challenge מחנות האפליקציות וצרו קבוצה.
            </p>
            <Button
              onClick={() => window.open(APP_STORE_LINK, '_blank')}
              className="w-full gradient-accent text-accent-foreground font-bold gap-2"
            >
              <Download className="h-4 w-4" />
              הורד את האפליקציה
            </Button>
          </div>

          {/* Step 2 */}
          <div className="gradient-card rounded-xl p-4 border border-accent/20">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2 justify-end">
              הצטרפו לליגת I2
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-black">2</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              לאחר שיצרתם קבוצה, הצטרפו לליגה שלנו עם הקוד הבא:
            </p>
            <button
              onClick={copyCode}
              className="w-full flex items-center justify-center gap-3 rounded-lg bg-card border-2 border-accent/40 px-4 py-3 transition-all hover:border-accent"
            >
              <Copy className="h-4 w-4 text-accent" />
              <span className="text-xl font-black tracking-widest text-foreground">{LEAGUE_CODE}</span>
            </button>
            <p className="text-xs text-muted-foreground mt-2 text-center">לחצו להעתקה</p>
          </div>

          {/* Step 3 */}
          <div className="gradient-card rounded-xl p-4 border border-green-500/20">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2 justify-end">
              הצטרפו לקבוצת הוואטסאפ
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white text-xs font-black">3</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              הצטרפו לצ'אט הקבוצתי לעדכונים, טראש טוק ותחרות!
            </p>
            <Button
              onClick={() => window.open(WHATSAPP_LINK, '_blank')}
              variant="outline"
              className="w-full text-green-400 border-green-500/30 hover:bg-green-500/10 font-bold gap-2"
            >
              💬 קבוצת וואטסאפ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FantasyInfoDialog;
