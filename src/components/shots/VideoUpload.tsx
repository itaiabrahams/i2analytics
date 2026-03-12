import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Video, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploadProps {
  sessionId: string | null;
  currentUrl: string | null;
  playerId: string;
  onUploaded: (url: string) => void;
}

const VideoUpload = ({ sessionId, currentUrl, playerId, onUploaded }: VideoUploadProps) => {
  const [uploading, setUploading] = useState(false);
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

    // Update shot_session video_url if we have a session
    if (sessionId) {
      await supabase.from('shot_sessions').update({ video_url: publicUrl }).eq('id', sessionId);
    }

    onUploaded(publicUrl);
    toast.success('הסרטון הועלה בהצלחה!');
    setUploading(false);
  };

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
              <Video className="h-4 w-4" />
              <span>סרטון מצורף</span>
            </div>
          </div>
          <video
            src={currentUrl}
            controls
            className="w-full rounded-lg max-h-48"
            preload="metadata"
          />
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full border-dashed border-2 border-muted-foreground/30 text-muted-foreground h-16"
        >
          {uploading ? (
            <><Loader2 className="ml-2 h-4 w-4 animate-spin" />מעלה סרטון...</>
          ) : (
            <><Upload className="ml-2 h-4 w-4" />העלה סרטון אימון</>
          )}
        </Button>
      )}
    </div>
  );
};

export default VideoUpload;
