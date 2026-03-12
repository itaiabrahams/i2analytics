import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Star, Plus, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Rating {
  id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  overall_rating: number;
  offense_rating: number;
  defense_rating: number;
  teamwork_rating: number;
  effort_rating: number;
  notes: string;
  created_at: string;
}

interface PlayerRatingsProps {
  playerId: string;
  isCoach: boolean;
}

const RATING_CATEGORIES = [
  { key: 'overall_rating', label: 'ציון כללי', color: 'text-accent' },
  { key: 'offense_rating', label: 'התקפה', color: 'text-accent' },
  { key: 'defense_rating', label: 'הגנה', color: 'text-accent' },
  { key: 'teamwork_rating', label: 'עבודת צוות', color: 'text-accent' },
  { key: 'effort_rating', label: 'מאמץ', color: 'text-accent' },
] as const;

const RatingStars = ({ value, max = 10 }: { value: number; max?: number }) => {
  const filled = Math.round((value / max) * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < filled ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="text-xs text-muted-foreground mr-1">{value}/10</span>
    </div>
  );
};

const PlayerRatings = ({ playerId, isCoach }: PlayerRatingsProps) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [periodType, setPeriodType] = useState('weekly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [overallRating, setOverallRating] = useState(5);
  const [offenseRating, setOffenseRating] = useState(5);
  const [defenseRating, setDefenseRating] = useState(5);
  const [teamworkRating, setTeamworkRating] = useState(5);
  const [effortRating, setEffortRating] = useState(5);
  const [notes, setNotes] = useState('');

  const fetchRatings = async () => {
    const { data } = await supabase
      .from('player_ratings')
      .select('*')
      .eq('player_id', playerId)
      .order('period_start', { ascending: false })
      .limit(20);
    if (data) setRatings(data as Rating[]);
  };

  useEffect(() => { fetchRatings(); }, [playerId]);

  // Auto-calculate period end based on type
  useEffect(() => {
    if (!periodStart) return;
    const start = new Date(periodStart);
    if (periodType === 'weekly') {
      start.setDate(start.getDate() + 6);
    } else {
      start.setMonth(start.getMonth() + 1);
      start.setDate(start.getDate() - 1);
    }
    setPeriodEnd(start.toISOString().slice(0, 10));
  }, [periodStart, periodType]);

  const handleSave = async () => {
    if (!periodStart || !periodEnd || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('player_ratings').insert({
        coach_id: user.id,
        player_id: playerId,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
        overall_rating: overallRating,
        offense_rating: offenseRating,
        defense_rating: defenseRating,
        teamwork_rating: teamworkRating,
        effort_rating: effortRating,
        notes,
      });
      if (error) throw error;
      toast.success('הדירוג נשמר בהצלחה!');
      setShowForm(false);
      resetForm();
      fetchRatings();
    } catch (err: any) {
      toast.error('שגיאה: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setPeriodStart('');
    setPeriodEnd('');
    setOverallRating(5);
    setOffenseRating(5);
    setDefenseRating(5);
    setTeamworkRating(5);
    setEffortRating(5);
    setNotes('');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <div className="gradient-card rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        {isCoach && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="text-accent"
          >
            <Plus className="ml-1 h-4 w-4" />
            {showForm ? 'ביטול' : 'דירוג חדש'}
          </Button>
        )}
        <h3 className="font-semibold text-foreground text-right flex items-center gap-2">
          <Star className="h-4 w-4 text-accent" />
          דירוגים והערות
        </h3>
      </div>

      {/* New rating form */}
      {showForm && isCoach && (
        <div className="bg-secondary rounded-lg p-4 mb-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block text-right mb-1">סוג תקופה</label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="weekly">שבועי</SelectItem>
                  <SelectItem value="monthly">חודשי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block text-right mb-1">
                <Calendar className="inline h-3 w-3 ml-1" />
                תאריך התחלה
              </label>
              <Input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>

          {periodEnd && (
            <p className="text-xs text-muted-foreground text-right">
              תקופה: {formatDate(periodStart)} - {formatDate(periodEnd)}
            </p>
          )}

          {/* Rating sliders */}
          <div className="space-y-3">
            {[
              { label: 'ציון כללי', value: overallRating, setter: setOverallRating },
              { label: 'התקפה', value: offenseRating, setter: setOffenseRating },
              { label: 'הגנה', value: defenseRating, setter: setDefenseRating },
              { label: 'עבודת צוות', value: teamworkRating, setter: setTeamworkRating },
              { label: 'מאמץ', value: effortRating, setter: setEffortRating },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-accent">{value}/10</span>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([v]) => setter(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground block text-right mb-1">הערות</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="הערות על הביצועים, נקודות לשיפור..."
              className="bg-muted border-border text-foreground text-right resize-none"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!periodStart || saving}
            className="w-full gradient-accent text-accent-foreground"
          >
            {saving ? 'שומר...' : 'שמור דירוג'}
          </Button>
        </div>
      )}

      {/* Ratings history */}
      <div className="space-y-2">
        {ratings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">אין דירוגים עדיין</p>
        ) : (
          ratings.map(r => (
            <div key={r.id} className="bg-secondary rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedId === r.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-lg font-bold text-accent">{r.overall_rating}/10</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {r.period_type === 'weekly' ? 'שבועי' : 'חודשי'} · {formatDate(r.period_start)} - {formatDate(r.period_end)}
                  </p>
                </div>
              </button>
              {expandedId === r.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {RATING_CATEGORIES.slice(1).map(cat => (
                      <div key={cat.key} className="flex items-center justify-between">
                        <RatingStars value={r[cat.key as keyof Rating] as number} />
                        <span className="text-xs text-muted-foreground">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                  {r.notes && (
                    <div className="bg-muted rounded-md p-2 mt-2">
                      <p className="text-xs text-muted-foreground text-right whitespace-pre-wrap">{r.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlayerRatings;
