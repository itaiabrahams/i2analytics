import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WORKOUT_MONTHS = [
  { index: 1, title: 'תוכנית עקיפה', subtitle: 'שליטה בכדור', year: 2026, month: 4, image: '/workouts/month-01.jpg', emoji: '🏀' },
  { index: 2, title: 'תוכנית קליעה', subtitle: 'טכניקת קליעה בסיסית', year: 2026, month: 5, image: '/workouts/month-02.jpg', emoji: '🎯' },
  { index: 3, title: 'תוכנית קליעה', subtitle: 'מכני קליעה ומכדור', year: 2026, month: 6, image: '/workouts/month-03.jpg', emoji: '📏' },
  { index: 4, title: 'תוכנית עקיפה', subtitle: 'שליטה בכדור - מתקדם', year: 2026, month: 7, image: '/workouts/month-04.jpg', emoji: '⚡' },
  { index: 5, title: 'תוכנית קליעה', subtitle: 'תוכנית קליעה מספר 3', year: 2026, month: 8, image: '/workouts/month-05.jpg', emoji: '🔥' },
  { index: 6, title: 'תוכנית שליטה', subtitle: 'שליטה בכדור', year: 2026, month: 9, image: '/workouts/month-06.jpg', emoji: '🤲' },
  { index: 7, title: 'תוכנית עבודה', subtitle: 'ילדום ה׳', year: 2026, month: 10, image: '/workouts/month-07.jpg', emoji: '💪' },
  { index: 8, title: 'תוכנית עקיפה', subtitle: 'מתאמנים אישיים', year: 2026, month: 11, image: '/workouts/month-08.jpg', emoji: '🏃' },
  { index: 9, title: 'תוכנית קליעה', subtitle: 'מתאמנים אישיים', year: 2026, month: 12, image: '/workouts/month-09.jpg', emoji: '🎯' },
  { index: 10, title: 'תוכנית קליעה', subtitle: 'מתאמנים אישיים - מתקדם', year: 2027, month: 1, image: '/workouts/month-10.jpg', emoji: '⭐' },
  { index: 11, title: 'תוכנית שליטה', subtitle: 'בכדור - ינואר', year: 2027, month: 2, image: '/workouts/month-11.jpg', emoji: '🏀' },
  { index: 12, title: 'תוכנית קליעה', subtitle: 'אימונים אישיים', year: 2027, month: 3, image: '/workouts/month-12.jpg', emoji: '🎯' },
  { index: 13, title: 'תוכנית עקיפה', subtitle: 'שלב מתקדם', year: 2027, month: 4, image: '/workouts/month-13.jpg', emoji: '⚡' },
  { index: 14, title: 'תוכנית קליעה', subtitle: 'שלב מתקדם', year: 2027, month: 5, image: '/workouts/month-14.jpg', emoji: '🔥' },
  { index: 15, title: 'תוכנית כוח', subtitle: 'ומהירות', year: 2027, month: 6, image: '/workouts/month-15.jpg', emoji: '💪' },
  { index: 16, title: 'תוכנית קליעה', subtitle: 'מתקדמים', year: 2027, month: 7, image: '/workouts/month-16.jpg', emoji: '🎯' },
  { index: 17, title: 'תוכנית עקיפה', subtitle: 'רמה גבוהה', year: 2027, month: 8, image: '/workouts/month-17.jpg', emoji: '⚡' },
  { index: 18, title: 'תוכנית קליעה', subtitle: 'קליעה בתנועה', year: 2027, month: 9, image: '/workouts/month-18.jpg', emoji: '🏃' },
  { index: 19, title: 'תוכנית עקיפה', subtitle: 'מגע ותנועה', year: 2027, month: 10, image: '/workouts/month-19.jpg', emoji: '🤲' },
  { index: 20, title: 'תוכנית קליעה', subtitle: 'Shooting in Motion', year: 2027, month: 11, image: '/workouts/month-20.jpg', emoji: '🎯' },
  { index: 21, title: 'תוכנית קליעה', subtitle: 'Catch and Shoot', year: 2027, month: 12, image: '/workouts/month-21.jpg', emoji: '🔥' },
  { index: 22, title: 'תוכנית קליעה', subtitle: 'מתאמנים אישיים - Pro', year: 2028, month: 1, image: '/workouts/month-22.jpg', emoji: '⭐' },
  { index: 23, title: 'תוכנית עקיפה', subtitle: 'מתקדמים - Pro', year: 2028, month: 2, image: '/workouts/month-23.jpg', emoji: '⚡' },
  { index: 24, title: 'תוכנית קליעה', subtitle: 'Elite', year: 2028, month: 3, image: '/workouts/month-24.jpg', emoji: '🏆' },
  { index: 25, title: 'תוכנית משולבת', subtitle: 'Elite', year: 2028, month: 4, image: '/workouts/month-25.jpg', emoji: '🏆' },
  { index: 26, title: 'תוכנית כוח', subtitle: 'Elite', year: 2028, month: 5, image: '/workouts/month-26.jpg', emoji: '💪' },
  { index: 27, title: 'תוכנית סיום', subtitle: 'סיכום ושיפור', year: 2028, month: 6, image: '/workouts/month-27.jpg', emoji: '🏅' },
];

function getCurrentMonthWorkout() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  // Find current or most recent unlocked month
  const unlocked = WORKOUT_MONTHS.filter(w => w.year < y || (w.year === y && w.month <= m));
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

const CurrentMonthWorkout = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const workout = getCurrentMonthWorkout();

  if (!workout) return null;

  return (
    <div className="gradient-card rounded-xl overflow-hidden border border-accent/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-sm font-bold text-foreground">{workout.title}</span>
              <Dumbbell className="h-4 w-4 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">{workout.subtitle} · תוכנית חודש {workout.index}</p>
          </div>
          <span className="text-2xl">{workout.emoji}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 animate-fade-in space-y-2">
          <div className="rounded-lg overflow-hidden border border-border/50">
            <img
              src={workout.image}
              alt={`${workout.title} - ${workout.subtitle}`}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs text-accent border-accent/30"
            onClick={() => navigate('/workout-plans')}
          >
            <ArrowLeft className="ml-1 h-3.5 w-3.5" />
            כל תוכניות העבודה
          </Button>
        </div>
      )}
    </div>
  );
};

export default CurrentMonthWorkout;
