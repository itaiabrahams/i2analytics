import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { Minus, Plus } from 'lucide-react';
import {
  ZoneId, ZONES,
  ShotType, Element, FinishType,
  SHOT_TYPE_LABELS, ELEMENT_LABELS, FINISH_TYPE_LABELS,
} from '@/lib/shotZones';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: ZoneId | null;
  onSubmit: (data: {
    zone: ZoneId;
    attempts: number;
    made: number;
    shotType: ShotType;
    element: Element | null;
    finishType: FinishType | null;
  }) => void;
}

const ShotInputDialog = ({ open, onOpenChange, zoneId, onSubmit }: Props) => {
  const [attempts, setAttempts] = useState(10);
  const [made, setMade] = useState(0);
  const [shotType, setShotType] = useState<ShotType>('catch_and_shoot');
  const [element, setElement] = useState<Element | null>(null);
  const [finishType, setFinishType] = useState<FinishType | null>(null);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  const zone = ZONES.find(z => z.id === zoneId);
  const isPaint = zone?.type === 'paint';

  const handleSubmit = () => {
    if (attempts <= 0) { setError('מספר זריקות חייב להיות חיובי'); return; }
    if (made > attempts) { setError('קליעות לא יכולות לעלות על מספר הזריקות'); return; }
    if (!zoneId) return;

    onSubmit({
      zone: zoneId,
      attempts,
      made,
      shotType,
      element: shotType === 'attack_off_dribble' ? element : null,
      finishType: shotType === 'attack_off_dribble' ? finishType : null,
    });

    setAttempts(10);
    setMade(0);
    setShotType('catch_and_shoot');
    setElement(null);
    setFinishType(null);
    setError('');
    onOpenChange(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setError('');
      setAttempts(10);
      setMade(0);
      setShotType('catch_and_shoot');
      setElement(null);
      setFinishType(null);
    }
    onOpenChange(v);
  };

  const pct = attempts > 0 ? Math.round((made / attempts) * 100) : 0;

  const CounterButton = ({ value, onChange, label, max }: { value: number; onChange: (v: number) => void; label: string; max: number }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-center block">{label}</Label>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center active:scale-95 transition-transform text-foreground"
        >
          <Minus className="h-5 w-5" />
        </button>
        <div className="h-14 w-16 rounded-xl bg-[hsl(220,35%,14%)] border border-border flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{value}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center active:scale-95 transition-transform text-foreground"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const formContent = (
    <div className="space-y-5 px-1" dir="rtl">
      {/* Percentage display */}
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-accent/15 border-2 border-accent/30">
          <span className="text-2xl font-black text-accent">{pct}%</span>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-6">
        <CounterButton value={attempts} onChange={(v) => { setAttempts(v); setError(''); if (made > v) setMade(v); }} label="זריקות" max={200} />
        <CounterButton value={made} onChange={(v) => { setMade(v); setError(''); }} label="קליעות" max={attempts} />
      </div>

      {/* Quick-set buttons */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {[5, 10, 15, 20, 25].map(n => (
          <button
            key={n}
            onClick={() => { setAttempts(n); if (made > n) setMade(n); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              attempts === n ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">סוג זריקה</Label>
        <Select value={shotType} onValueChange={v => { setShotType(v as ShotType); setError(''); }}>
          <SelectTrigger className="h-11 text-sm rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SHOT_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-sm py-3">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {shotType === 'attack_off_dribble' && (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Element</Label>
            <Select value={element || ''} onValueChange={v => setElement(v as Element)}>
              <SelectTrigger className="h-11 text-sm rounded-xl">
                <SelectValue placeholder="בחר element" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ELEMENT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-sm py-3">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Finish Type</Label>
            <Select value={finishType || ''} onValueChange={v => setFinishType(v as FinishType)}>
              <SelectTrigger className="h-11 text-sm rounded-xl">
                <SelectValue placeholder="בחר finish type" />
              </SelectTrigger>
              <SelectContent>
                {(isPaint
                  ? Object.entries(FINISH_TYPE_LABELS)
                  : Object.entries(FINISH_TYPE_LABELS).filter(([k]) => k === 'jump_shot')
                ).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-sm py-3">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button onClick={handleSubmit} className="w-full gradient-accent text-accent-foreground h-14 text-base font-bold rounded-2xl active:scale-[0.98] transition-transform">
        שמור 🏀
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-center pb-0">
            <DrawerTitle className="text-lg font-bold">
              {zone?.label || 'זריקה'} 🏀
            </DrawerTitle>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            {zone?.label || 'זריקה'} 🏀
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default ShotInputDialog;
