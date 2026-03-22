import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Upload, Link, Video, Loader2, ArrowLeft, ArrowRight, Check, Target } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import BasketballCourt from '@/components/shots/BasketballCourt';
import ShotInputDialog from '@/components/shots/ShotInputDialog';
import ShotStats from '@/components/shots/ShotStats';
import { ZoneId, ZoneStats, ZONES, ShotType, Element, FinishType } from '@/lib/shotZones';

interface NewTrainingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  coachId?: string;
  selectedDate: Date;
  onSessionCreated: (sessionId: string) => void;
}

type Step = 'details' | 'court';

const NewTrainingWizard = ({
  open, onOpenChange, playerId, coachId, selectedDate, onSessionCreated,
}: NewTrainingWizardProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<Step>('details');
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [shots, setShots] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [shotDialogOpen, setShotDialogOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isVideoRequired = (): boolean => {
    const cutoff = new Date(2026, 2, 16);
    const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return selected >= cutoff;
  };

  const reset = () => {
    setStep('details');
    setTitle('');
    setVideoFile(null);
    setVideoLink('');
    setShowLinkInput(false);
    setSessionId(null);
    setShots([]);
    setSelectedZone(null);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) { toast.error('יש להעלות קובץ וידאו בלבד'); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error('גודל קובץ מקסימלי: 100MB'); return; }
    setVideoFile(file);
  };

  const handleCreateAndGoToCourt = async () => {
    if (!title.trim()) { toast.error('יש להזין כותרת לאימון'); return; }
    const videoRequired = isVideoRequired();
    const hasVideo = videoFile || videoLink.trim();
    if (videoRequired && !hasVideo) { toast.error('יש להעלות סרטון או קישור כהוכחה'); return; }

    setCreating(true);
    let videoUrl: string | null = null;

    if (videoLink.trim()) {
      videoUrl = videoLink.trim();
    } else if (videoFile) {
      setUploading(true);
      const ext = videoFile.name.split('.').pop();
      const path = `${playerId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('shot-videos').upload(path, videoFile, { cacheControl: '3600', upsert: true });
      if (uploadError) { toast.error('שגיאה בהעלאת הסרטון'); setCreating(false); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('shot-videos').getPublicUrl(path);
      videoUrl = urlData.publicUrl;
      setUploading(false);
    }

    const { data, error } = await supabase.from('shot_sessions').insert({
      player_id: playerId,
      coach_id: coachId || null,
      title: title.trim(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      video_url: videoUrl,
    }).select('id').single();

    if (error || !data) { toast.error('שגיאה ביצירת אימון'); setCreating(false); return; }
    
    setSessionId(data.id);
    setStep('court');
    setCreating(false);
    toast.success('האימון נוצר! עכשיו הזן זריקות על המגרש');
  };

  const fetchShots = useCallback(async (sid: string) => {
    const { data } = await supabase.from('shots').select('*').eq('session_id', sid);
    if (data) setShots(data);
  }, []);

  const handleZoneClick = (zoneId: ZoneId) => {
    setSelectedZone(zoneId);
    setShotDialogOpen(true);
  };

  const handleShotSubmit = async (data: {
    zone: ZoneId; attempts: number; made: number;
    shotType: ShotType; element: Element | null; finishType: FinishType | null;
  }) => {
    if (!sessionId) return;
    const { error } = await supabase.from('shots').insert({
      session_id: sessionId, zone: data.zone,
      attempts: data.attempts, made: data.made,
      shot_type: data.shotType, element: data.element, finish_type: data.finishType,
    });
    if (error) { toast.error('שגיאה בשמירת הזריקות'); return; }
    toast.success('הזריקות נשמרו!');
    fetchShots(sessionId);
  };

  const zoneStats: ZoneStats[] = ZONES.map(zone => {
    const zoneShots = shots.filter(s => s.zone === zone.id);
    const attempts = zoneShots.reduce((s, sh) => s + sh.attempts, 0);
    const made = zoneShots.reduce((s, sh) => s + sh.made, 0);
    return { zone: zone.id, attempts, made, percentage: attempts > 0 ? Math.round((made / attempts) * 100) : 0 };
  });

  const totalAttempts = zoneStats.reduce((s, z) => s + z.attempts, 0);
  const totalMade = zoneStats.reduce((s, z) => s + z.made, 0);

  const handleFinish = () => {
    onSessionCreated(sessionId!);
    handleClose(false);
  };

  const content = (
    <div className="space-y-4" dir="rtl">
      <input ref={fileRef} type="file" accept="video/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'details' ? 'text-accent' : 'text-muted-foreground'}`}>
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'details' ? 'gradient-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>1</div>
          פרטים
        </div>
        <div className="h-px w-8 bg-border" />
        <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'court' ? 'text-accent' : 'text-muted-foreground'}`}>
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'court' ? 'gradient-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>2</div>
          הזנת זריקות
        </div>
      </div>

      {step === 'details' && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">אימון חדש</h2>
            <p className="text-xs text-muted-foreground">{format(selectedDate, 'dd/MM/yyyy')}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-right block text-sm font-medium">כותרת אימון</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder='לדוגמה: "אימון קליעות בוקר"'
              maxLength={100}
              className="text-right h-12 text-sm rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-right block text-sm font-medium">
              סרטון אימון {isVideoRequired() ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(אופציונלי)</span>}
            </Label>
            {videoFile ? (
              <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
                <Button size="sm" variant="ghost" onClick={() => setVideoFile(null)} className="text-muted-foreground h-8 px-3 text-xs">הסר</Button>
                <div className="flex items-center gap-1.5 text-success">
                  <Video className="h-4 w-4" />
                  <span className="text-xs truncate max-w-[180px]">{videoFile.name}</span>
                </div>
              </div>
            ) : videoLink ? (
              <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
                <Button size="sm" variant="ghost" onClick={() => setVideoLink('')} className="text-muted-foreground h-8 px-3 text-xs">הסר</Button>
                <div className="flex items-center gap-1.5 text-success">
                  <Link className="h-4 w-4" />
                  <span className="text-xs">קישור סרטון ✓</span>
                </div>
              </div>
            ) : showLinkInput ? (
              <div className="space-y-2">
                <Input value={videoLink} onChange={e => setVideoLink(e.target.value)}
                  placeholder="הדבק קישור YouTube או Google Drive"
                  className="text-right h-11 text-xs rounded-xl" dir="ltr" />
                <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)} className="text-xs w-full h-9">חזור</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowLinkInput(true)}
                  className="border-dashed border-2 border-accent/30 text-muted-foreground h-14 rounded-xl flex flex-col gap-0.5 active:scale-[0.97] transition-all">
                  <Link className="h-4 w-4" /><span className="text-[10px]">קישור</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}
                  className="border-dashed border-2 border-accent/30 text-muted-foreground h-14 rounded-xl flex flex-col gap-0.5 active:scale-[0.97] transition-all">
                  <Upload className="h-4 w-4" /><span className="text-[10px]">העלה קובץ</span>
                </Button>
              </div>
            )}
          </div>

          <Button onClick={handleCreateAndGoToCourt}
            disabled={creating || !title.trim() || (isVideoRequired() && !videoFile && !videoLink.trim())}
            className="w-full gradient-accent text-accent-foreground h-12 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform">
            {uploading ? <><Loader2 className="ml-1.5 h-4 w-4 animate-spin" />מעלה סרטון...</>
              : creating ? <><Loader2 className="ml-1.5 h-4 w-4 animate-spin" />יוצר אימון...</>
              : <><ArrowLeft className="ml-1.5 h-4 w-4" />המשך להזנת זריקות</>}
          </Button>
        </div>
      )}

      {step === 'court' && (
        <div className="space-y-3">
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">הזן זריקות על המגרש</h2>
            <p className="text-xs text-muted-foreground">לחץ על אזור במגרש כדי להזין נתונים</p>
          </div>

          {/* Quick stats */}
          {totalAttempts > 0 && (
            <div className="flex items-center justify-center gap-4 rounded-xl bg-secondary p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totalAttempts}</p>
                <p className="text-[10px] text-muted-foreground">ניסיונות</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-success">{totalMade}</p>
                <p className="text-[10px] text-muted-foreground">קליעות</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-accent">
                  {totalAttempts > 0 ? Math.round((totalMade / totalAttempts) * 100) : 0}%
                </p>
                <p className="text-[10px] text-muted-foreground">אחוז</p>
              </div>
            </div>
          )}

          <div className="rounded-xl overflow-hidden">
            <BasketballCourt
              zoneStats={zoneStats}
              onZoneClick={handleZoneClick}
              showHeatMap={true}
              interactive={true}
            />
          </div>

          <Button onClick={handleFinish}
            className="w-full gradient-accent text-accent-foreground h-12 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform">
            <Check className="ml-1.5 h-4 w-4" />
            {totalAttempts > 0 ? 'סיום וחזרה' : 'סיום (ללא זריקות)'}
          </Button>
        </div>
      )}

      <ShotInputDialog
        open={shotDialogOpen}
        onOpenChange={setShotDialogOpen}
        zoneId={selectedZone}
        onSubmit={handleShotSubmit}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="px-4 pb-8 max-h-[92vh] overflow-y-auto">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default NewTrainingWizard;
