import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [attempts, setAttempts] = useState('');
  const [made, setMade] = useState('');
  const [shotType, setShotType] = useState<ShotType>('catch_and_shoot');
  const [element, setElement] = useState<Element | null>(null);
  const [finishType, setFinishType] = useState<FinishType | null>(null);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  const zone = ZONES.find(z => z.id === zoneId);
  const isPaint = zone?.type === 'paint';

  const handleSubmit = () => {
    const att = parseInt(attempts);
    const md = parseInt(made);

    if (isNaN(att) || att < 0 || att > 200) {
      setError('מספר זריקות לא תקין (0-200)');
      return;
    }
    if (isNaN(md) || md < 0 || md > att) {
      setError('מספר קליעות לא תקין (0 עד מספר הזריקות)');
      return;
    }
    if (!zoneId) return;

    onSubmit({
      zone: zoneId,
      attempts: att,
      made: md,
      shotType,
      element: shotType === 'attack_off_dribble' ? element : null,
      finishType: shotType === 'attack_off_dribble' ? finishType : null,
    });

    setAttempts('');
    setMade('');
    setShotType('catch_and_shoot');
    setElement(null);
    setFinishType(null);
    setError('');
    onOpenChange(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setError('');
      setAttempts('');
      setMade('');
      setShotType('catch_and_shoot');
      setElement(null);
      setFinishType(null);
    }
    onOpenChange(v);
  };

  const formContent = (
    <div className="space-y-5 px-1" dir="rtl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">זריקות (Attempts)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={attempts}
            onChange={e => { setAttempts(e.target.value); setError(''); }}
            placeholder="0"
            className="h-12 text-lg text-center font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">קליעות (Made)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={made}
            onChange={e => { setMade(e.target.value); setError(''); }}
            placeholder="0"
            className="h-12 text-lg text-center font-semibold"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">סוג זריקה</Label>
        <Select value={shotType} onValueChange={v => { setShotType(v as ShotType); setError(''); }}>
          <SelectTrigger className="h-12 text-sm">
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
              <SelectTrigger className="h-12 text-sm">
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
              <SelectTrigger className="h-12 text-sm">
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSubmit} className="w-full gradient-accent text-accent-foreground h-14 text-base font-bold rounded-xl">
        שמור זריקות 🏀
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-right">
            <DrawerTitle className="flex items-center gap-2 justify-end text-lg">
              <span>{zone?.label || 'זריקה'}</span>
              <span className="text-accent">🏀</span>
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
          <DialogTitle className="text-right flex items-center gap-2">
            <span className="text-accent">🏀</span>
            {zone?.label || 'זריקה'}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default ShotInputDialog;
