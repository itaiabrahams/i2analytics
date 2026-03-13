import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  playerId: string;
  isPlayer: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  'מה לשפר': 'bg-warning/20 text-warning',
  'מה לא לגעת': 'bg-destructive/20 text-destructive',
  'דגשים למשחק': 'bg-accent/20 text-accent',
  'חוזקות': 'bg-success/20 text-success',
  'כללי': 'bg-muted text-muted-foreground',
};

const TeamCoachFeedbackSection = ({ playerId, isPlayer }: Props) => {
  const [token, setToken] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Get or create token
      let { data: tokenData } = await supabase
        .from('team_coach_tokens')
        .select('token')
        .eq('player_id', playerId)
        .single();

      if (!tokenData && isPlayer) {
        const { data: newToken } = await supabase
          .from('team_coach_tokens')
          .insert({ player_id: playerId })
          .select('token')
          .single();
        tokenData = newToken;
      }

      if (tokenData) setToken(tokenData.token);

      // Load feedback
      const { data: fb } = await supabase
        .from('team_coach_feedback')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (fb) setFeedbacks(fb);
      setLoading(false);
    };

    load();
  }, [playerId, isPlayer]);

  const feedbackUrl = token ? `${window.location.origin}/team-feedback/${token}` : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(feedbackUrl);
    setCopied(true);
    toast.success('הלינק הועתק!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;

  return (
    <div className="gradient-card rounded-xl p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">פידבק מאמן קבוצה</h3>
        </div>
      </div>

      {/* Share link - visible to player */}
      {isPlayer && token && (
        <div className="mb-4 rounded-lg bg-secondary p-3 space-y-2">
          <p className="text-sm text-muted-foreground">שלח את הלינק הזה למאמן הקבוצה שלך:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-3 py-2 text-xs text-foreground border border-border" dir="ltr">
              {feedbackUrl}
            </code>
            <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Feedback list */}
      {feedbacks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {isPlayer ? 'עדיין לא התקבל פידבק ממאמן הקבוצה' : 'אין פידבק ממאמן קבוצה עדיין'}
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="rounded-lg bg-secondary p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[fb.category] || CATEGORY_COLORS['כללי']}`}>
                  {fb.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(fb.created_at).toLocaleDateString('he-IL')}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{fb.content}</p>
              <p className="text-xs text-muted-foreground">מאת: {fb.coach_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamCoachFeedbackSection;
