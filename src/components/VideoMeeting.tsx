import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, ExternalLink, X } from 'lucide-react';

interface VideoMeetingProps {
  meetingUrl: string;
}

const VideoMeeting = ({ meetingUrl }: VideoMeetingProps) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);

  if (!meetingUrl) return null;

  return (
    <div className="gradient-card rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {showEmbed && (
            <Button variant="ghost" size="sm" onClick={() => setShowEmbed(false)}>
              <X className="h-4 w-4" />
            </Button>
          )}
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            פתח בחלון חדש
          </a>
        </div>
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Video className="h-4 w-4" />
          פגישת וידאו
        </h3>
      </div>

      {!showEmbed && !embedFailed && (
        <Button
          onClick={() => setShowEmbed(true)}
          className="w-full gradient-accent text-accent-foreground"
        >
          <Video className="ml-2 h-4 w-4" />
          הצג פגישה כאן
        </Button>
      )}

      {showEmbed && (
        <div className="relative w-full rounded-lg overflow-hidden bg-secondary" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={meetingUrl}
            className="absolute inset-0 w-full h-full border-0 rounded-lg"
            allow="camera; microphone; display-capture; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            onError={() => {
              setEmbedFailed(true);
              setShowEmbed(false);
            }}
          />
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <p className="text-xs text-muted-foreground bg-background/80 rounded px-2 py-1 inline-block">
              אם הפגישה לא נטענת,{' '}
              <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                לחץ כאן לפתיחה בחלון חדש
              </a>
            </p>
          </div>
        </div>
      )}

      {embedFailed && (
        <div className="text-center p-4 bg-secondary rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">לא ניתן להטמיע את הפגישה כאן</p>
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-accent hover:underline font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            פתח פגישה בחלון חדש
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoMeeting;
