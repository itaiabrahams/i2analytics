import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ShotSession {
  id: string;
  title: string;
  date: string;
  video_url: string | null;
}

interface ShotCalendarProps {
  sessions: ShotSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onSessionCreated: () => void;
  playerId: string;
  coachId?: string;
  canCreate: boolean;
}

const ShotCalendar = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onSessionCreated,
  playerId,
  coachId,
  canCreate,
}: ShotCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Map dates to sessions
  const sessionsByDate = useMemo(() => {
    const map: Record<string, ShotSession[]> = {};
    sessions.forEach(s => {
      const dateKey = s.date.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    });
    return map;
  }, [sessions]);

  // Dates that have sessions
  const datesWithSessions = useMemo(() => {
    return sessions.map(s => new Date(s.date));
  }, [sessions]);

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const sessionsForDate = selectedDateKey ? (sessionsByDate[selectedDateKey] || []) : [];

  const handleCreateSession = async () => {
    if (!newTitle.trim()) {
      toast.error('יש להזין כותרת לאימון');
      return;
    }
    if (!selectedDate) return;

    setCreating(true);
    const { error } = await supabase.from('shot_sessions').insert({
      player_id: playerId,
      coach_id: coachId || null,
      title: newTitle.trim(),
      date: format(selectedDate, 'yyyy-MM-dd'),
    });

    if (error) {
      toast.error('שגיאה ביצירת אימון');
    } else {
      toast.success('אימון חדש נוצר!');
      setNewTitle('');
      onSessionCreated();
    }
    setCreating(false);
  };

  return (
    <div className="gradient-card rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-end gap-2">
        <h3 className="font-semibold text-foreground">לוח אימונים</h3>
        <CalendarDays className="h-5 w-5 text-accent" />
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={he}
          modifiers={{
            hasSessions: datesWithSessions,
          }}
          modifiersClassNames={{
            hasSessions: 'bg-accent/30 font-bold text-accent-foreground',
          }}
          className="rounded-lg border border-border"
        />
      </div>

      {/* Sessions for selected date */}
      {selectedDate && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-right">
            {format(selectedDate, 'dd/MM/yyyy', { locale: he })}
          </p>

          {sessionsForDate.length > 0 ? (
            <div className="space-y-1.5">
              {sessionsForDate.map(s => (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`w-full rounded-lg p-3 text-right text-sm font-medium transition-all ${
                    s.id === activeSessionId
                      ? 'gradient-accent text-accent-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.title || 'אימון'}
                  {s.video_url && <span className="mr-2 text-xs">🎥</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">אין אימונים בתאריך זה</p>
          )}

          {/* Create new session for this date */}
          {canCreate && (
            <div className="flex gap-2 items-end pt-2 border-t border-border">
              <Button
                size="sm"
                onClick={handleCreateSession}
                disabled={creating}
                className="gradient-accent text-accent-foreground shrink-0"
              >
                <Plus className="ml-1 h-4 w-4" />
                {creating ? 'יוצר...' : 'הוסף'}
              </Button>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-right block">כותרת אימון</Label>
                <Input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder='לדוגמה: "אימון קליעות בוקר"'
                  maxLength={100}
                  className="text-right h-8 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShotCalendar;
