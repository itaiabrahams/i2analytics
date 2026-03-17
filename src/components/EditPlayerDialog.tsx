import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: { user_id: string; display_name: string; team: string | null; age: number | null } | null;
  onSaved: () => void;
}

const EditPlayerDialog = ({ open, onOpenChange, player, onSaved }: EditPlayerDialogProps) => {
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (player) {
      setName(player.display_name || '');
      setTeam(player.team || '');
      setAge(player.age != null ? String(player.age) : '');
    }
  }, [player, open]);

  const handleSave = async () => {
    if (!player) return;
    const trimmedName = name.trim();
    const trimmedTeam = team.trim();
    const ageNum = age ? parseInt(age) : null;

    if (!trimmedName || trimmedName.length > 100) {
      toast.error('שם חייב להיות בין 1 ל-100 תווים');
      return;
    }
    if (ageNum !== null && (isNaN(ageNum) || ageNum < 5 || ageNum > 99)) {
      toast.error('גיל חייב להיות בין 5 ל-99');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: trimmedName,
        team: trimmedTeam || null,
        age: ageNum,
      })
      .eq('user_id', player.user_id);

    setSaving(false);
    if (error) {
      toast.error('שגיאה בעדכון פרטי השחקן');
    } else {
      toast.success('פרטי השחקן עודכנו בהצלחה');
      onOpenChange(false);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">עריכת פרטי שחקן</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>שם תצוגה</Label>
            <Input value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="שם השחקן" />
          </div>
          <div className="space-y-2">
            <Label>קבוצה</Label>
            <Input value={team} onChange={e => setTeam(e.target.value)} maxLength={100} placeholder="שם הקבוצה" />
          </div>
          <div className="space-y-2">
            <Label>גיל</Label>
            <Input type="number" value={age} onChange={e => setAge(e.target.value)} min={5} max={99} placeholder="גיל" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-accent text-accent-foreground">
            {saving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerDialog;
