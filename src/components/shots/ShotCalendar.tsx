import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import NewTrainingWizard from '@/components/shots/NewTrainingWizard';

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
  onDateSelect?: (dateKey: string) => void;
  playerId: string;
  coachId?: string;
  canCreate: boolean;
}

const ShotCalendar = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onSessionCreated,
  onDateSelect,
  playerId,
  coachId,
  canCreate,
}: ShotCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(format(date, 'yyyy-MM-dd'));
    }
  };

  const sessionsByDate = useMemo(() => {
    const map: Record<string, ShotSession[]> = {};
    sessions.forEach(s => {
      const dateKey = s.date.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    });
    return map;
  }, [sessions]);

  const datesWithSessions = useMemo(() => {
    return sessions.map(s => new Date(s.date));
  }, [sessions]);

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const sessionsForDate = selectedDateKey ? (sessionsByDate[selectedDateKey] || []) : [];

  const isRetroAllowed = (date: Date): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (selected > today) return false;
    if (selected.getTime() === today.getTime()) return true;
    if (now.getFullYear() === 2026 && now.getMonth() === 2) {
      return selected.getFullYear() === 2026 && selected.getMonth() === 2;
    }
    return false;
  };

  const handleSessionCreated = (sessionId: string) => {
    onSessionCreated();
    onSelectSession(sessionId);
  };

  return (
    <div className="gradient-card rounded-xl p-3 sm:p-4 space-y-4">
      <div className="flex items-center justify-end gap-2">
        <h3 className="font-semibold text-foreground">לוח אימונים</h3>
        <CalendarDays className="h-5 w-5 text-accent" />
      </div>

      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateChange}
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

      {selectedDate && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-right font-medium">
            {format(selectedDate, 'dd/MM/yyyy', { locale: he })}
          </p>

          {sessionsForDate.length > 0 ? (
            <div className="space-y-2">
              {sessionsForDate.map(s => (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`w-full rounded-xl p-3.5 text-right text-sm font-medium transition-all active:scale-[0.97] ${
                    s.id === activeSessionId
                      ? 'gradient-accent text-accent-foreground shadow-md'
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

          {canCreate && selectedDate && isRetroAllowed(selectedDate) && (
            <Button
              onClick={() => setWizardOpen(true)}
              className="w-full gradient-accent text-accent-foreground h-12 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform"
            >
              <Plus className="ml-1.5 h-4 w-4" />
              הוסף אימון חדש
            </Button>
          )}
        </div>
      )}

      {selectedDate && (
        <NewTrainingWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          playerId={playerId}
          coachId={coachId}
          selectedDate={selectedDate}
          onSessionCreated={handleSessionCreated}
        />
      )}
    </div>
  );
};

export default ShotCalendar;
