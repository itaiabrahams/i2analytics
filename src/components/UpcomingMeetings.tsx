import { useState, useEffect } from 'react';
import { Video, Calendar, Clock, ExternalLink, Pencil, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import EditMeetingDialog from '@/components/EditMeetingDialog';

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

interface UpcomingMeetingsProps {
  playerId: string;
}

const UpcomingMeetings = ({ playerId }: UpcomingMeetingsProps) => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);

  const fetchMeetings = async () => {
    const { data } = await supabase
      .from('scheduled_meetings')
      .select('*')
      .eq('player_id', playerId)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(10);
    if (data) setMeetings(data as Meeting[]);
  };

  useEffect(() => { fetchMeetings(); }, [playerId]);

  const handleStartSession = (meeting: Meeting) => {
    const params = new URLSearchParams({
      meetingId: meeting.id,
      title: meeting.title,
      meetingUrl: meeting.meeting_url || '',
      videoUrl: (meeting as any).video_url || '',
      notes: meeting.notes || '',
      date: new Date(meeting.scheduled_at).toISOString().slice(0, 10),
    });
    navigate(`/player/${playerId}/new-session?${params.toString()}`);
  };

  if (meetings.length === 0) return null;

  const isCoach = auth.role === 'coach';
  const now = new Date();

  return (
    <div className="gradient-card rounded-xl p-4 mb-6">
      <h3 className="font-semibold text-foreground text-right mb-3 flex items-center gap-2 justify-end">
        פגישות מתוזמנות
        <Video className="h-4 w-4 text-accent" />
      </h3>
      <div className="space-y-2">
        {meetings.map(m => {
          const d = new Date(m.scheduled_at);
          const isPast = d <= now;
          return (
            <div key={m.id} className={`bg-secondary rounded-lg p-3 ${isPast ? 'border border-accent/30' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCoach && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setEditMeeting(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {m.meeting_url && (
                    <a href={m.meeting_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="text-accent">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
                <div className="text-right flex-1">
                  <p className="text-sm font-medium text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 justify-end">
                    <span>{d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                    <Clock className="h-3 w-3" />
                    <span>{d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    <Calendar className="h-3 w-3" />
                  </p>
                  {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                </div>
              </div>
              {isPast && (
                <Button
                  onClick={() => handleStartSession(m)}
                  className="w-full mt-2 gradient-accent text-accent-foreground font-semibold gap-2"
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                  התחל סשן מהפגישה הזו
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <EditMeetingDialog
        open={!!editMeeting}
        onOpenChange={(o) => { if (!o) setEditMeeting(null); }}
        meeting={editMeeting}
        onSaved={fetchMeetings}
        onStartSession={handleStartSession}
      />
    </div>
  );
};

export default UpcomingMeetings;
