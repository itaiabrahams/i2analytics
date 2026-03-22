import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, Video, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Meeting {
  id: string;
  title: string;
  meeting_url: string | null;
  video_url?: string | null;
  scheduled_at: string;
  notes: string | null;
  status: string;
  player_id: string;
}

interface EditMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting | null;
  onSaved?: () => void;
  onStartSession?: (meeting: Meeting) => void;
}

const EditMeetingDialog = ({ open, onOpenChange, meeting, onSaved, onStartSession }: EditMeetingDialogProps) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title || '');
      const d = new Date(meeting.scheduled_at);
      setDate(d.toISOString().slice(0, 10));
      setTime(d.toTimeString().slice(0, 5));
      setMeetingUrl(meeting.meeting_url || '');
      setVideoUrl((meeting as any).video_url || '');
      setNotes(meeting.notes || '');
    }
  }, [meeting]);

  const handleSave = async () => {
    if (!meeting || !title || !date || !time) return;
    setSaving(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const { error } = await supabase
        .from('scheduled_meetings')
        .update({
          title,
          scheduled_at: scheduledAt,
          meeting_url: meetingUrl || null,
          video_url: videoUrl || null,
          notes: notes || null,
        })
        .eq('id', meeting.id);

      if (error) throw error;
      toast.success('הפגישה עודכנה בהצלחה');
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      toast.error('שגיאה בעדכון: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isPast = meeting ? new Date(meeting.scheduled_at) <= new Date() : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 justify-end">
            <span>עריכת פגישה</span>
            <Video className="h-5 w-5 text-accent" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block text-right mb-1">כותרת</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-secondary border-border text-foreground text-right" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground block text-right mb-1">
                <Clock className="inline h-3 w-3 ml-1" />שעה
              </label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-secondary border-border text-foreground" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block text-right mb-1">
                <CalendarIcon className="inline h-3 w-3 ml-1" />תאריך
              </label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-border text-foreground" />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground block text-right mb-1">קישור לפגישה (Zoom / Google Meet)</label>
            <Input value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} placeholder="https://meet.google.com/..." className="bg-secondary border-border text-foreground text-right" dir="ltr" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground block text-right mb-1">קישור לסרטון (YouTube / Google Drive)</label>
            <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="bg-secondary border-border text-foreground text-right" dir="ltr" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground block text-right mb-1">הערות</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-secondary border-border text-foreground text-right resize-none" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!title || !date || !time || saving} className="flex-1 gradient-accent text-accent-foreground">
              {saving ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </div>

          {isPast && onStartSession && meeting && (
            <Button
              variant="outline"
              onClick={() => { onOpenChange(false); onStartSession(meeting); }}
              className="w-full border-success text-success hover:bg-success/10"
            >
              <Play className="ml-2 h-4 w-4" />
              התחל סשן מהפגישה הזו
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMeetingDialog;
