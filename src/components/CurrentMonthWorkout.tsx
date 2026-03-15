import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SHOOTING_DRILLS: Record<number, string[]> = {
  1: ['קליעה מעמידה - 5 עמדות × 10 זריקות', 'Catch & Shoot מהכנף - 3 סטים × 8', 'זריקות חופשיות - 20 רצוף'],
  2: ['מכניקת קליעה - תרגול יד מובילה × 50', 'קליעה אחרי דריבל פול-אפ - 4 סטים × 6', 'זריקות מהפינות - 3 סטים × 10'],
  3: ['קליעה מדריבל - Crossover Pull-up × 30', 'Catch & Shoot מהטופ - 3 סטים × 10', 'זריקות חופשיות תחת לחץ - 2/1/1'],
  4: ['קליעה בתנועה - Curl Cuts × 24', 'Step-back Jumper - 4 סטים × 6', 'קליעה מהכנף אחרי מסך - 3 סטים × 8'],
  5: ['קליעה מ-3 נקודות - סיבוב 5 עמדות × 3', 'Off-the-Dribble Mid-Range × 30', 'זריקות חופשיות - 30 רצוף'],
  6: ['Quick Release Shooting - 4 סטים × 8', 'קליעה אחרי Hesitation - 3 סטים × 6', 'Spot-up Shooting - 5 עמדות × 8'],
  7: ['קליעה בעומס - Sprint & Shoot × 20', 'Pick & Pop Shooting - 3 סטים × 8', 'זריקות חופשיות - 25 רצוף'],
  8: ['Floater Training - 4 סטים × 6', 'קליעה מ-Mid Range - 5 עמדות × 6', 'Catch & Shoot מהירות - 3 סטים × 10'],
  9: ['תרגול מכניקה - One Hand Form × 50', 'קליעה אחרי Cut - 3 סטים × 8', 'Game Shots - סימולציה × 20'],
  10: ['קליעה מ-3 תחת לחץ זמן - 4 סטים × 6', 'Pull-up Mid-Range - 4 סטים × 6', 'זריקות חופשיות - 2 סטים × 15'],
  11: ['קליעה מעמידה מתקדמת - 5 עמדות × 12', 'Step-back 3PT - 3 סטים × 6', 'Off-Screen Shooting - 3 סטים × 8'],
  12: ['Contested Shooting - 4 סטים × 6', 'קליעה בריצה - Transition 3s × 20', 'זריקות חופשיות - 30 רצוף'],
  13: ['Relocate & Shoot - 4 סטים × 8', 'קליעה אחרי Behind-the-back - 3 סטים × 6', 'Spot-up מהירות - 5 עמדות × 10'],
  14: ['קליעה בתנועה רציפה - 3 סטים × 10', 'Deep 3-Point Shooting × 20', 'זריקות חופשיות תחרותיות - 20'],
  15: ['Power Move + Finish - 4 סטים × 6', 'קליעה תחת עייפות - Sprint × Shoot × 15', 'Mid-Range Game Spots × 30'],
  16: ['Advanced Catch & Shoot - 4 סטים × 10', 'Dribble Combo into Shot × 24', 'זריקות חופשיות - 35 רצוף'],
  17: ['Step-back + Side-step 3s - 3 סטים × 8', 'קליעה מ-Handoff - 4 סטים × 6', 'Pin-Down Shooting × 20'],
  18: ['Movement Shooting Circuit × 30', 'Curl + Flare Shooting - 3 סטים × 8', 'זריקות חופשיות - 25 רצוף'],
  19: ['Touch & Shoot - 5 עמדות × 8', 'Triple Threat Shot - 3 סטים × 8', 'Off-Dribble Deep Range × 20'],
  20: ['Shooting in Motion - Full Court × 20', 'DHO Shooting - 4 סטים × 6', 'זריקות חופשיות - 30 רצוף'],
  21: ['Catch & Shoot - Quick Feet × 30', 'Coming off Screens - 4 סטים × 8', 'Contested 3s × 20'],
  22: ['Pro Shot Routine - 5 עמדות × 10', 'Pick & Pop Advanced × 24', 'זריקות חופשיות - 40 רצוף'],
  23: ['Combo Moves + Finish × 30', 'Transition Pull-up × 20', 'Deep Range + Mid-Range Circuit × 24'],
  24: ['Elite Shooting Circuit × 40', 'Game-Speed Catch & Shoot × 30', 'זריקות חופשיות - 50 רצוף'],
  25: ['Full Court Shooting Drill × 30', 'Contested Step-back × 20', 'Off-Screen Complex × 24'],
  26: ['Power Shooting - Heavy Ball × 20', 'Sprint & Shoot Endurance × 30', 'זריקות חופשיות - 40 רצוף'],
  27: ['Complete Shooting Review × 40', 'All Zones Game Simulation × 30', 'Final Free Throw Challenge - 50 רצוף'],
};

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

          {SHOOTING_DRILLS[workout.index] && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-bold text-accent">🎯 תרגילי קליעה לחודש זה</span>
              </div>
              <ul className="space-y-1 text-right" dir="rtl">
                {SHOOTING_DRILLS[workout.index].map((drill, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent mt-0.5">•</span>
                    <span>{drill}</span>
                  </li>
                ))}
              </ul>
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
