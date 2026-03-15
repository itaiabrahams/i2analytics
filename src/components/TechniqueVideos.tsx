import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Video, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TechniqueVideosProps {
  playerId: string;
  isOwnProfile: boolean;
}

const CATEGORIES = [
  { id: 'form', label: 'טכניקת קליעה', emoji: '🎯' },
  { id: 'midrange', label: 'חצי מרחק', emoji: '📏' },
  { id: 'three', label: 'שלשות', emoji: '🏀' },
];

const TechniqueVideos = ({ playerId, isOwnProfile }: TechniqueVideosProps) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchVideos = async () => {
    const { data } = await supabase
      .from('player_technique_videos')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    if (data) setVideos(data);
  };

  useEffect(() => { fetchVideos(); }, [playerId]);

  const handleUpload = async (category: string, file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('יש להעלות קובץ וידאו בלבד');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('גודל קובץ מקסימלי: 100MB');
      return;
    }

    setUploading(category);
    const ext = file.name.split('.').pop();
    const path = `${playerId}/technique_${category}_${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from('shot-videos').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadErr) {
      toast.error('שגיאה בהעלאת הסרטון');
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('shot-videos').getPublicUrl(path);

    // Delete old video for this category
    const existing = videos.find(v => v.category === category);
    if (existing) {
      await supabase.from('player_technique_videos').delete().eq('id', existing.id);
    }

    await (supabase.from('player_technique_videos' as any) as any).insert({
      player_id: playerId,
      category,
      video_url: urlData.publicUrl,
    });

    toast.success('הסרטון הועלה בהצלחה!');
    setUploading(null);
    fetchVideos();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('player_technique_videos' as any).delete().eq('id', id);
    toast.success('הסרטון נמחק');
    fetchVideos();
  };

  return (
    <div className="gradient-card rounded-xl p-4">
      <h3 className="mb-4 text-right font-semibold text-foreground flex items-center gap-2 justify-end">
        <span>סרטוני טכניקה</span>
        <Video className="h-5 w-5 text-accent" />
      </h3>
      <div className="space-y-3">
        {CATEGORIES.map(cat => {
          const video = videos.find(v => v.category === cat.id);
          return (
            <div key={cat.id} className="rounded-lg bg-secondary p-3">
              <div className="flex items-center justify-between mb-2">
                {isOwnProfile && !video && (
                  <>
                    <input
                      ref={el => { fileRefs.current[cat.id] = el; }}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={e => { if (e.target.files?.[0]) handleUpload(cat.id, e.target.files[0]); }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fileRefs.current[cat.id]?.click()}
                      disabled={uploading === cat.id}
                      className="text-accent text-xs"
                    >
                      {uploading === cat.id ? (
                        <><Loader2 className="ml-1 h-3 w-3 animate-spin" />מעלה...</>
                      ) : (
                        <><Upload className="ml-1 h-3 w-3" />העלה</>
                      )}
                    </Button>
                  </>
                )}
                {isOwnProfile && video && (
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(video.id)} className="text-muted-foreground h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {!isOwnProfile && !video && <div />}
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm font-medium text-foreground">{cat.label}</span>
                  <span>{cat.emoji}</span>
                </div>
              </div>
              {video && (
                <video
                  src={video.video_url}
                  controls
                  className="w-full rounded-lg max-h-48"
                  preload="metadata"
                />
              )}
              {!video && (
                <p className="text-xs text-muted-foreground text-center py-2">לא הועלה סרטון</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TechniqueVideos;
