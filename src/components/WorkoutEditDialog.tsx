import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface WorkoutPlan {
  id: string;
  month_index: number;
  title: string;
  subtitle: string;
  month_label: string;
  year: number;
  month: number;
  emoji: string;
  image_url: string | null;
  shooting_image_url: string | null;
}

interface Props {
  plan: WorkoutPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const WorkoutEditDialog = ({ plan, open, onOpenChange, onSaved }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(plan.title);
  const [subtitle, setSubtitle] = useState(plan.subtitle);
  const [emoji, setEmoji] = useState(plan.emoji);
  const [imageUrl, setImageUrl] = useState(plan.image_url || '');
  const [shootingImageUrl, setShootingImageUrl] = useState(plan.shooting_image_url || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('workout_plans')
        .update({
          title,
          subtitle,
          emoji,
          image_url: imageUrl || null,
          shooting_image_url: shootingImageUrl || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', plan.id);

      if (error) throw error;
      toast.success('תוכנית עודכנה בהצלחה!');
      onSaved();
    } catch (err: any) {
      toast.error('שגיאה: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>עריכת חודש {plan.month_index} — {plan.month_label} {plan.year}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>כותרת</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>תת-כותרת</Label>
            <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} />
          </div>
          <div>
            <Label>אימוג׳י</Label>
            <Input value={emoji} onChange={e => setEmoji(e.target.value)} className="text-2xl w-20" />
          </div>
          <div>
            <Label>קישור תמונת אימון (URL)</Label>
            <Input
              placeholder="https://..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
          </div>
          <div>
            <Label>קישור תמונת קליעה (URL)</Label>
            <Input
              placeholder="https://..."
              value={shootingImageUrl}
              onChange={e => setShootingImageUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-accent text-accent-foreground">
            {saving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutEditDialog;
