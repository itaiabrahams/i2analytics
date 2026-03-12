import { useState, useEffect } from 'react';
import { Video, Calendar, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface Meeting {
  id: string;
  title: string;
  meeting_url: string;
  scheduled_at: string;
  notes: string;
  status: string;
}

interface UpcomingMeetingsProps {
  playerId: string;
}

const UpcomingMeetings = ({ playerId }: UpcomingMeetingsProps) => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const fetchMeetings = async () => {
      const { data } = await supabase
        .from('scheduled_meetings')
        .select('*')
        .eq('player_id', playerId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);
      if (data) setMeetings(data);
    };
    fetchMeetings();
  }, [playerId]);

  if (meetings.length === 0) return null;

  return (
    <div className="gradient-card rounded-xl p-4 mb-6">
      <h3 className="font-semibold text-foreground text-right mb-3 flex items-center gap-2 justify-end">
        פגישות קרובות
        <Video className="h-4 w-4 text-accent" />
      </h3>
      <div className="space-y-2">
        {meetings.map(m => {
          const d = new Date(m.scheduled_at);
          return (
            <div key={m.id} className="flex items-center justify-between bg-secondary rounded-lg p-3">
              <div className="flex items-center gap-2">
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
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingMeetings;
