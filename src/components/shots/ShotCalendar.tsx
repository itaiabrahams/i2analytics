import { useState, useMemo, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CalendarDays, Upload, Loader2, Video, Link } from 'lucide-react';
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
  const [videoLink, setVideoLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const isVideoRequired = (date: Date): boolean => {
    const cutoff = new Date(2026, 2, 16);
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
    const hasVideo = videoFile || videoLink.trim();

    if (videoRequired && !hasVideo) {
      toast.error('יש להעלות סרטון או להזין קישור כהוכחה לאימון');
      return;
    }

    if (!isRetroAllowed(selectedDate)) {
      toast.error('ניתן לדווח רק על אימונים של היום');
      return;
    }

    setCreating(true);

    let videoUrl: string | null = null;

    if (videoLink.trim()) {
      videoUrl = videoLink.trim();
    } else if (videoFile) {
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
      setVideoLink('');
      setShowLinkInput(false);
      onSessionCreated();
    }
    setCreating(false);
  };

  return (
    <div className="gradient-card rounded-xl p-3 sm:p-4 space-y-4">
      <div className="flex items-center justify-end gap-2">
        <h3 className="font-semibold text-foreground">לוח אימונים</h3>
        <CalendarDays className="h-5 w-5 text-accent" />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
      />

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

          {canCreate && selectedDate && isRetroAllowed(selectedDate) && (() => {
            const videoRequired = isVideoRequired(selectedDate);
            return (
            <div className="space-y-4 pt-3 border-t border-border">
              <div className="space-y-1.5">
                <Label className="text-xs text-right block font-medium">כותרת אימון</Label>
                <Input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder='לדוגמה: "אימון קליעות בוקר"'
                  maxLength={100}
                  className="text-right h-11 text-sm rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-right block font-medium">
                  סרטון אימון {videoRequired && <span className="text-destructive">*</span>}
                  {!videoRequired && <span className="text-muted-foreground">(אופציונלי)</span>}
                </Label>
                {videoFile ? (
                  <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setVideoFile(null)}
                      className="text-muted-foreground h-8 px-3 text-xs"
                    >
                      הסר
                    </Button>
                    <div className="flex items-center gap-1.5 text-success">
                      <Video className="h-4 w-4" />
                      <span className="text-xs truncate max-w-[140px]">{videoFile.name}</span>
                    </div>
                  </div>
                ) : videoLink ? (
                  <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setVideoLink('')}
                      className="text-muted-foreground h-8 px-3 text-xs"
                    >
                      הסר
                    </Button>
                    <div className="flex items-center gap-1.5 text-success">
                      <Link className="h-4 w-4" />
                      <span className="text-xs">קישור סרטון</span>
                    </div>
                  </div>
                ) : showLinkInput ? (
                  <div className="space-y-2.5">
                    <Input
                      value={videoLink}
                      onChange={e => setVideoLink(e.target.value)}
                      placeholder="הדבק קישור YouTube או Google Drive"
                      className="text-right h-11 text-xs rounded-xl"
                      dir="ltr"
                    />
                    <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)} className="text-xs w-full h-10">חזור</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLinkInput(true)}
                      className="border-dashed border-2 border-accent/30 text-muted-foreground h-14 rounded-xl flex flex-col gap-0.5 active:scale-[0.97] transition-all"
                    >
                      <Link className="h-4 w-4" />
                      <span className="text-[10px]">קישור</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                      className="border-dashed border-2 border-accent/30 text-muted-foreground h-14 rounded-xl flex flex-col gap-0.5 active:scale-[0.97] transition-all"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-[10px]">העלה קובץ</span>
                    </Button>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                onClick={handleCreateSession}
                disabled={creating || (videoRequired && !videoFile && !videoLink.trim())}
                className="w-full gradient-accent text-accent-foreground h-12 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform"
              >
                {uploading ? (
                  <><Loader2 className="ml-1.5 h-4 w-4 animate-spin" />מעלה סרטון ויוצר אימון...</>
                ) : (
                  <><Plus className="ml-1.5 h-4 w-4" />{creating ? 'יוצר...' : 'הוסף אימון'}</>
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
