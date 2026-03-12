import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
  onScheduled?: () => void;
}

const ScheduleMeetingDialog = ({ open, onOpenChange, playerId, playerName, onScheduled }: ScheduleMeetingDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !date || !time || !user) return;

    setSaving(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();

      // Create the meeting
      const { data: meeting, error: meetingError } = await supabase
        .from('scheduled_meetings')
        .insert({
          coach_id: user.id,
          player_id: playerId,
          title,
          meeting_url: meetingUrl,
          scheduled_at: scheduledAt,
          notes,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Create notification for the player
      const formattedDate = new Date(scheduledAt).toLocaleDateString('he-IL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
      const formattedTime = new Date(scheduledAt).toLocaleTimeString('he-IL', {
        hour: '2-digit', minute: '2-digit',
      });

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: playerId,
          title: 'פגישת וידאו חדשה',
          message: `נקבעה פגישת וידאו "${title}" בתאריך ${formattedDate} בשעה ${formattedTime}`,
          type: 'meeting',
          reference_id: meeting.id,
        });

      if (notifError) console.error('Notification error:', notifError);

      toast.success('הפגישה תוזמנה בהצלחה!');
      onOpenChange(false);
      setTitle('');
      setDate('');
      setTime('');
      setMeetingUrl('');
      setNotes('');
      onScheduled?.();
    } catch (err: any) {
      toast.error('שגיאה בתזמון הפגישה: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 justify-end">
            <span>תזמון פגישת וידאו עם {playerName}</span>
            <Video className="h-5 w-5 text-accent" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block text-right mb-1">כותרת הפגישה</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="למשל: סקירת משחק נגד הפועל"
              className="bg-secondary border-border text-foreground text-right"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground block text-right mb-1">
                <Clock className="inline h-3 w-3 ml-1" />
                שעה
              </label>
              <Input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block text-right mb-1">
                <CalendarIcon className="inline h-3 w-3 ml-1" />
                תאריך
              </label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground block text-right mb-1">קישור לפגישה (Google Meet / Zoom)</label>
            <Input
              value={meetingUrl}
              onChange={e => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="bg-secondary border-border text-foreground text-right"
              dir="ltr"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground block text-right mb-1">הערות</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="הערות לפגישה..."
              className="bg-secondary border-border text-foreground text-right resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!title || !date || !time || saving}
            className="w-full gradient-accent text-accent-foreground"
          >
            {saving ? 'מתזמן...' : 'תזמן פגישה'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetingDialog;
