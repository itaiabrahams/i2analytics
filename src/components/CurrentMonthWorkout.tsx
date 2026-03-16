import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronDown, ChevronUp, ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SHOOTING_DRILLS, isCombinedWorkout } from '@/lib/shootingDrills';
import ShootingDrillsCard from '@/components/ShootingDrillsCard';

const WORKOUT_MONTHS = [
  { index: 1, title: 'עקיפה + קליעה', subtitle: 'שליטה בכדור וטכניקת קליעה', year: 2026, month: 4, image: '/workouts/month-01.jpg', emoji: '🏀' },
  { index: 2, title: 'תוכנית קליעה', subtitle: 'טכניקת קליעה בסיסית', year: 2026, month: 5, image: '/workouts/month-02.jpg', emoji: '🎯' },
  { index: 3, title: 'תוכנית קליעה', subtitle: 'מכני קליעה ומכדור', year: 2026, month: 6, image: '/workouts/month-03.jpg', emoji: '📏' },
  { index: 4, title: 'עקיפה + קליעה', subtitle: 'שליטה מתקדמת וקליעה מכדרור', year: 2026, month: 7, image: '/workouts/month-04.jpg', emoji: '⚡' },
  { index: 5, title: 'תוכנית קליעה', subtitle: 'תוכנית קליעה מספר 3', year: 2026, month: 8, image: '/workouts/month-05.jpg', emoji: '🔥' },
  { index: 6, title: 'שליטה + קליעה', subtitle: 'שליטה בכדור וקליעה מהירה', year: 2026, month: 9, image: '/workouts/month-06.jpg', emoji: '🤲' },
  { index: 7, title: 'עבודה + קליעה', subtitle: 'תרגול מקיף וקליעה', year: 2026, month: 10, image: '/workouts/month-07.jpg', emoji: '💪' },
  { index: 8, title: 'עקיפה + קליעה', subtitle: 'אימון אישי משולב', year: 2026, month: 11, image: '/workouts/month-08.jpg', emoji: '🏃' },
  { index: 9, title: 'תוכנית קליעה', subtitle: 'מתאמנים אישיים', year: 2026, month: 12, image: '/workouts/month-09.jpg', emoji: '🎯' },
  { index: 10, title: 'תוכנית קליעה', subtitle: 'מתאמנים אישיים - מתקדם', year: 2027, month: 1, image: '/workouts/month-10.jpg', emoji: '⭐' },
  { index: 11, title: 'שליטה + קליעה', subtitle: 'שליטה בכדור וקליעה מעמידה', year: 2027, month: 2, image: '/workouts/month-11.jpg', emoji: '🏀' },
  { index: 12, title: 'תוכנית קליעה', subtitle: 'אימונים אישיים', year: 2027, month: 3, image: '/workouts/month-12.jpg', emoji: '🎯' },
  { index: 13, title: 'עקיפה + קליעה', subtitle: 'שלב מתקדם משולב', year: 2027, month: 4, image: '/workouts/month-13.jpg', emoji: '⚡' },
  { index: 14, title: 'תוכנית קליעה', subtitle: 'שלב מתקדם', year: 2027, month: 5, image: '/workouts/month-14.jpg', emoji: '🔥' },
  { index: 15, title: 'כוח + קליעה', subtitle: 'מהירות וקליעה תחת לחץ', year: 2027, month: 6, image: '/workouts/month-15.jpg', emoji: '💪' },
  { index: 16, title: 'תוכנית קליעה', subtitle: 'מתקדמים', year: 2027, month: 7, image: '/workouts/month-16.jpg', emoji: '🎯' },
  { index: 17, title: 'עקיפה + קליעה', subtitle: 'רמה גבוהה משולב', year: 2027, month: 8, image: '/workouts/month-17.jpg', emoji: '⚡' },
  { index: 18, title: 'תוכנית קליעה', subtitle: 'קליעה בתנועה', year: 2027, month: 9, image: '/workouts/month-18.jpg', emoji: '🏃' },
  { index: 19, title: 'עקיפה + קליעה', subtitle: 'מגע, תנועה וקליעה', year: 2027, month: 10, image: '/workouts/month-19.jpg', emoji: '🤲' },
  { index: 20, title: 'תוכנית קליעה', subtitle: 'Shooting in Motion', year: 2027, month: 11, image: '/workouts/month-20.jpg', emoji: '🎯' },
  { index: 21, title: 'תוכנית קליעה', subtitle: 'Catch and Shoot', year: 2027, month: 12, image: '/workouts/month-21.jpg', emoji: '🔥' },
  { index: 22, title: 'תוכנית קליעה', subtitle: 'מתאמנים אישיים - Pro', year: 2028, month: 1, image: '/workouts/month-22.jpg', emoji: '⭐' },
  { index: 23, title: 'עקיפה + קליעה', subtitle: 'מתקדמים Pro משולב', year: 2028, month: 2, image: '/workouts/month-23.jpg', emoji: '⚡' },
  { index: 24, title: 'תוכנית קליעה', subtitle: 'Elite', year: 2028, month: 3, image: '/workouts/month-24.jpg', emoji: '🏆' },
  { index: 25, title: 'תוכנית משולבת', subtitle: 'Elite - עקיפה וקליעה', year: 2028, month: 4, image: '/workouts/month-25.jpg', emoji: '🏆' },
  { index: 26, title: 'כוח + קליעה', subtitle: 'Elite - כוח וקליעה', year: 2028, month: 5, image: '/workouts/month-26.jpg', emoji: '💪' },
  { index: 27, title: 'תוכנית סיום', subtitle: 'סיכום כולל - שליטה וקליעה', year: 2028, month: 6, image: '/workouts/month-27.jpg', emoji: '🏅' },
];

function getCurrentMonthWorkout() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const unlocked = WORKOUT_MONTHS.filter(w => w.year < y || (w.year === y && w.month <= m));
  if (unlocked.length > 0) return unlocked[unlocked.length - 1];
  return WORKOUT_MONTHS[0];
}

const CurrentMonthWorkout = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const workout = getCurrentMonthWorkout();

  if (!workout) return null;

  const hasCombined = isCombinedWorkout(workout.title);
  const hasShootingDrills = !!SHOOTING_DRILLS[workout.index];
  const totalPages = hasShootingDrills ? 2 : 1;
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
        <div className="px-3 pb-3 animate-fade-in space-y-3">
          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      i === page ? 'bg-accent' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {page === 0 ? (hasCombined ? '📋 שליטה בכדור' : '🎯 תוכנית קליעה') : '🎯 תוכנית קליעה'}
              </span>
            </div>
          )}

          {/* Page 0: Workout image */}
          {page === 0 && (
            <div className="rounded-lg overflow-hidden border border-border/50">
              <img
                src={workout.image}
                alt={`${workout.title} - ${workout.subtitle}`}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          )}

          {/* Page 1: Shooting drills image */}
          {page === 1 && hasShootingDrills && (
            <div className="rounded-lg overflow-hidden border border-border/50">
              <img
                src={workout.image}
                alt={`תוכנית קליעה - חודש ${workout.index}`}
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="bg-accent/10 p-2 text-center">
                <span className="text-xs font-medium text-accent">🎯 תוכנית קליעה - חודש {workout.index}</span>
              </div>
            </div>
          )}

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
