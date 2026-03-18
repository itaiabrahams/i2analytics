import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Video, X, Loader2, Link } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploadProps {
  sessionId: string | null;
  currentUrl: string | null;
  playerId: string;
  onUploaded: (url: string) => void;
}

const isExternalVideoUrl = (url: string) =>
  /youtube\.com|youtu\.be|drive\.google\.com/i.test(url);

const getEmbedUrl = (url: string): string | null => {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  return null;
};

const VideoUpload = ({ sessionId, currentUrl, playerId, onUploaded }: VideoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('יש להעלות קובץ וידאו בלבד');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('גודל קובץ מקסימלי: 100MB');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${playerId}/${sessionId || 'temp'}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('shot-videos').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      toast.error('שגיאה בהעלאת הסרטון');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('shot-videos').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    if (sessionId) {
      await supabase.from('shot_sessions').update({ video_url: publicUrl }).eq('id', sessionId);
    }

    onUploaded(publicUrl);
    toast.success('הסרטון הועלה בהצלחה!');
    setUploading(false);
  };

  const handleLinkSubmit = async () => {
    const trimmed = linkValue.trim();
    if (!trimmed) return;
    if (!isExternalVideoUrl(trimmed)) {
      toast.error('יש להזין קישור מ-YouTube או Google Drive');
      return;
    }
    if (sessionId) {
      await supabase.from('shot_sessions').update({ video_url: trimmed }).eq('id', sessionId);
    }
    onUploaded(trimmed);
    toast.success('קישור הסרטון נשמר בהצלחה!');
    setLinkValue('');
    setShowLinkInput(false);
  };

  const embedUrl = currentUrl ? getEmbedUrl(currentUrl) : null;
  const isExternal = currentUrl ? isExternalVideoUrl(currentUrl) : false;

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
      />

      {currentUrl ? (
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-center justify-between mb-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUploaded('')}
              className="text-muted-foreground h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="flex items-center gap-1 text-sm text-success">
              {isExternal ? <Link className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              <span>{isExternal ? 'קישור סרטון' : 'סרטון מצורף'}</span>
            </div>
          </div>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full rounded-lg aspect-video"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <video
              src={currentUrl}
              controls
              className="w-full rounded-lg max-h-48"
              preload="metadata"
            />
          )}
        </div>
      ) : showLinkInput ? (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Input
            value={linkValue}
            onChange={e => setLinkValue(e.target.value)}
            placeholder="הדבק קישור YouTube או Google Drive"
            className="text-right text-sm"
            dir="ltr"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setShowLinkInput(false); setLinkValue(''); }} className="flex-1">
              ביטול
            </Button>
            <Button size="sm" onClick={handleLinkSubmit} disabled={!linkValue.trim()} className="flex-1 gradient-accent text-accent-foreground">
              <Link className="ml-1 h-3 w-3" />שמור קישור
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowLinkInput(true)}
            className="flex-1 border-dashed border-2 border-muted-foreground/30 text-muted-foreground h-16"
          >
            <Link className="ml-2 h-4 w-4" />קישור YouTube / Drive
          </Button>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-1 border-dashed border-2 border-muted-foreground/30 text-muted-foreground h-16"
          >
            {uploading ? (
              <><Loader2 className="ml-2 h-4 w-4 animate-spin" />מעלה...</>
            ) : (
              <><Upload className="ml-2 h-4 w-4" />העלה קובץ</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
