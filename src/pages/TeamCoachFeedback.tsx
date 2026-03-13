import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle } from 'lucide-react';

const CATEGORIES = ['מה לשפר', 'מה לא לגעת', 'דגשים למשחק', 'חוזקות', 'כללי'];

const TeamCoachFeedback = () => {
  const { token } = useParams();
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [coachName, setCoachName] = useState('');
  const [category, setCategory] = useState('כללי');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) { setInvalidToken(true); setLoading(false); return; }
    
    // Verify token and get player info
    const verify = async () => {
      const { data: tokenData } = await supabase
        .from('team_coach_tokens')
        .select('player_id')
        .eq('token', token)
        .single();
      
      if (!tokenData) {
        setInvalidToken(true);
        setLoading(false);
        return;
      }

      setPlayerId(tokenData.player_id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', tokenData.player_id)
        .single();

      if (profile) setPlayerName(profile.display_name);
      setLoading(false);
    };

    verify();
  }, [token]);

  const handleSubmit = async () => {
    if (!coachName.trim()) { setError('יש להזין את שמך'); return; }
    if (!content.trim()) { setError('יש להזין תוכן'); return; }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase
      .from('team_coach_feedback')
      .insert({
        player_id: playerId,
        feedback_token: token,
        coach_name: coachName.trim(),
        category,
        content: content.trim(),
      });

    if (insertError) {
      setError('שגיאה בשליחה, נסה שוב');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/20">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">לינק לא תקין</h1>
          <p className="text-muted-foreground">הלינק שקיבלת אינו תקין או שפג תוקפו</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <CheckCircle className="mx-auto h-16 w-16 text-success" />
          <h1 className="text-xl font-bold text-foreground">תודה רבה!</h1>
          <p className="text-muted-foreground">הפידבק שלך נשלח בהצלחה ל{playerName}</p>
          <Button onClick={() => { setSubmitted(false); setContent(''); setCoachName(''); }} variant="outline">
            שלח פידבק נוסף
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
            <span className="text-2xl font-black text-accent">I²</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">פידבק למאמן אישי</h1>
          <p className="mt-2 text-muted-foreground">
            טופס פידבק עבור השחקן <span className="font-semibold text-foreground">{playerName}</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="space-y-2">
            <Label>שם המאמן</Label>
            <Input
              placeholder="השם שלך"
              value={coachName}
              onChange={e => { setCoachName(e.target.value); setError(''); }}
              className="h-12 bg-secondary border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label>קטגוריה</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>תוכן הפידבק</Label>
            <Textarea
              placeholder="מה חשוב לך שהמאמן האישי ידע? על מה השחקן צריך לעבוד? מה לא לגעת בו?"
              value={content}
              onChange={e => { setContent(e.target.value); setError(''); }}
              className="min-h-[120px] bg-secondary border-border text-foreground"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-lg font-semibold"
          >
            {submitting ? 'שולח...' : 'שלח פידבק'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamCoachFeedback;
