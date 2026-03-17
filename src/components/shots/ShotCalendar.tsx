import { useState, useMemo, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CalendarDays, Upload, Loader2, Video } from 'lucide-react';
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

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(format(date, 'yyyy-MM-dd'));
    }
  };
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('יש להעלות קובץ וידאו בלבד');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('גודל קובץ מקסימלי: 100MB');
      return;
    }
    setVideoFile(file);
  };

  // Check if retroactive logging is allowed for the selected date
  const isRetroAllowed = (date: Date): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Future dates are never allowed
    if (selected > today) return false;
    
    // Today is always allowed
    if (selected.getTime() === today.getTime()) return true;
    
    // March 2026: allow retroactive logging for any date within March
    if (now.getFullYear() === 2026 && now.getMonth() === 2) {
      return selected.getFullYear() === 2026 && selected.getMonth() === 2;
    }
    
    // Otherwise, only today
    return false;
  };

  // Check if video is required for the selected date
  // Before March 16, 2026 (retro dates in March) → video optional
  // March 16 onwards → video required
  const isVideoRequired = (date: Date): boolean => {
    const cutoff = new Date(2026, 2, 16); // March 16, 2026
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return selected >= cutoff;
  };

  const handleCreateSession = async () => {
    if (!newTitle.trim()) {
      toast.error('יש להזין כותרת לאימון');
      return;
    }
    if (!selectedDate) return;

    const videoRequired = isVideoRequired(selectedDate);

    if (videoRequired && !videoFile) {
      toast.error('יש להעלות סרטון וידאו כהוכחה לאימון');
      return;
    }
    
    if (!isRetroAllowed(selectedDate)) {
      toast.error('ניתן לדווח רק על אימונים של היום');
      return;
    }

    setCreating(true);

    let videoUrl: string | null = null;

    if (videoFile) {
      setUploading(true);
      const ext = videoFile.name.split('.').pop();
      const path = `${playerId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('shot-videos').upload(path, videoFile, {
        cacheControl: '3600',
        upsert: true,
      });

      if (uploadError) {
        toast.error('שגיאה בהעלאת הסרטון');
        setCreating(false);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('shot-videos').getPublicUrl(path);
      videoUrl = urlData.publicUrl;
      setUploading(false);
    }

    // Create session
    const { error } = await supabase.from('shot_sessions').insert({
      player_id: playerId,
      coach_id: coachId || null,
      title: newTitle.trim(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      video_url: videoUrl,
    });

    if (error) {
      toast.error('שגיאה ביצירת אימון');
    } else {
      toast.success(videoUrl ? 'אימון חדש נוצר עם סרטון!' : 'אימון חדש נוצר!');
      setNewTitle('');
      setVideoFile(null);
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

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
      />

      {/* Calendar */}
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
          {canCreate && selectedDate && isRetroAllowed(selectedDate) && (() => {
            const videoRequired = isVideoRequired(selectedDate);
            return (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <Label className="text-xs text-right block">כותרת אימון</Label>
                <Input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder='לדוגמה: "אימון קליעות בוקר"'
                  maxLength={100}
                  className="text-right h-8 text-sm"
                />
              </div>

              {/* Video upload */}
              <div className="space-y-1">
                <Label className="text-xs text-right block">
                  סרטון אימון {videoRequired && <span className="text-destructive">*</span>}
                  {!videoRequired && <span className="text-muted-foreground">(אופציונלי)</span>}
                </Label>
                {videoFile ? (
                  <div className="flex items-center justify-between rounded-lg bg-secondary p-2 text-sm">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setVideoFile(null)}
                      className="text-muted-foreground h-6 px-2 text-xs"
                    >
                      הסר
                    </Button>
                    <div className="flex items-center gap-1 text-success">
                      <Video className="h-3 w-3" />
                      <span className="text-xs truncate max-w-[150px]">{videoFile.name}</span>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-dashed border-2 border-muted-foreground/30 text-muted-foreground h-10"
                  >
                    <Upload className="ml-2 h-4 w-4" />
                    {videoRequired ? 'העלה סרטון (חובה)' : 'העלה סרטון (אופציונלי)'}
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                onClick={handleCreateSession}
                disabled={creating || (videoRequired && !videoFile)}
                className="w-full gradient-accent text-accent-foreground"
              >
                {uploading ? (
                  <><Loader2 className="ml-1 h-4 w-4 animate-spin" />מעלה סרטון ויוצר אימון...</>
                ) : (
                  <><Plus className="ml-1 h-4 w-4" />{creating ? 'יוצר...' : 'הוסף אימון'}</>
                )}
              </Button>
            </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ShotCalendar;
