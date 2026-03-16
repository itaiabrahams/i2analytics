import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, ChevronDown, ChevronUp, Dumbbell, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isCombinedWorkout } from '@/lib/shootingDrills';
import ShootingDrillsCard from '@/components/ShootingDrillsCard';

const HEBREW_MONTHS = [
  'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר',
  'אוקטובר', 'נובמבר', 'דצמבר', 'ינואר', 'פברואר', 'מרץ',
];

interface WorkoutMonth {
  index: number;
  title: string;
  subtitle: string;
  monthLabel: string;
  year: number;
  month: number; // 1-12
  image: string;
  emoji: string;
}

const WORKOUT_MONTHS: WorkoutMonth[] = [
  { index: 1, title: 'עקיפה + קליעה', subtitle: 'שליטה בכדור וטכניקת קליעה', monthLabel: 'אפריל', year: 2026, month: 4, image: '/workouts/month-01.jpg', emoji: '🏀' },
  { index: 2, title: 'תוכנית קליעה', subtitle: 'טכניקת קליעה בסיסית', monthLabel: 'מאי', year: 2026, month: 5, image: '/workouts/month-02.jpg', emoji: '🎯' },
  { index: 3, title: 'תוכנית קליעה', subtitle: 'מכני קליעה ומכדור', monthLabel: 'יוני', year: 2026, month: 6, image: '/workouts/month-03.jpg', emoji: '📏' },
  { index: 4, title: 'עקיפה + קליעה', subtitle: 'שליטה מתקדמת וקליעה מכדרור', monthLabel: 'יולי', year: 2026, month: 7, image: '/workouts/month-04.jpg', emoji: '⚡' },
  { index: 5, title: 'תוכנית קליעה', subtitle: 'תוכנית קליעה מספר 3', monthLabel: 'אוגוסט', year: 2026, month: 8, image: '/workouts/month-05.jpg', emoji: '🔥' },
  { index: 6, title: 'שליטה + קליעה', subtitle: 'שליטה בכדור וקליעה מהירה', monthLabel: 'ספטמבר', year: 2026, month: 9, image: '/workouts/month-06.jpg', emoji: '🤲' },
  { index: 7, title: 'עבודה + קליעה', subtitle: 'תרגול מקיף וקליעה', monthLabel: 'אוקטובר', year: 2026, month: 10, image: '/workouts/month-07.jpg', emoji: '💪' },
  { index: 8, title: 'עקיפה + קליעה', subtitle: 'אימון אישי משולב', monthLabel: 'נובמבר', year: 2026, month: 11, image: '/workouts/month-08.jpg', emoji: '🏃' },
  { index: 9, title: 'תוכנית קליעה', subtitle: 'מתאמנים אישיים', monthLabel: 'דצמבר', year: 2026, month: 12, image: '/workouts/month-09.jpg', emoji: '🎯' },
  { index: 10, title: 'תוכנית קליעה', subtitle: 'מתאמנים אישיים - מתקדם', monthLabel: 'ינואר', year: 2027, month: 1, image: '/workouts/month-10.jpg', emoji: '⭐' },
  { index: 11, title: 'שליטה + קליעה', subtitle: 'שליטה בכדור וקליעה מעמידה', monthLabel: 'פברואר', year: 2027, month: 2, image: '/workouts/month-11.jpg', emoji: '🏀' },
  { index: 12, title: 'תוכנית קליעה', subtitle: 'אימונים אישיים', monthLabel: 'מרץ', year: 2027, month: 3, image: '/workouts/month-12.jpg', emoji: '🎯' },
  { index: 13, title: 'עקיפה + קליעה', subtitle: 'שלב מתקדם משולב', monthLabel: 'אפריל', year: 2027, month: 4, image: '/workouts/month-13.jpg', emoji: '⚡' },
  { index: 14, title: 'תוכנית קליעה', subtitle: 'שלב מתקדם', monthLabel: 'מאי', year: 2027, month: 5, image: '/workouts/month-14.jpg', emoji: '🔥' },
  { index: 15, title: 'כוח + קליעה', subtitle: 'מהירות וקליעה תחת לחץ', monthLabel: 'יוני', year: 2027, month: 6, image: '/workouts/month-15.jpg', emoji: '💪' },
  { index: 16, title: 'תוכנית קליעה', subtitle: 'מתקדמים', monthLabel: 'יולי', year: 2027, month: 7, image: '/workouts/month-16.jpg', emoji: '🎯' },
  { index: 17, title: 'עקיפה + קליעה', subtitle: 'רמה גבוהה משולב', monthLabel: 'אוגוסט', year: 2027, month: 8, image: '/workouts/month-17.jpg', emoji: '⚡' },
  { index: 18, title: 'תוכנית קליעה', subtitle: 'קליעה בתנועה', monthLabel: 'ספטמבר', year: 2027, month: 9, image: '/workouts/month-18.jpg', emoji: '🏃' },
  { index: 19, title: 'עקיפה + קליעה', subtitle: 'מגע, תנועה וקליעה', monthLabel: 'אוקטובר', year: 2027, month: 10, image: '/workouts/month-19.jpg', emoji: '🤲' },
  { index: 20, title: 'תוכנית קליעה', subtitle: 'Shooting in Motion', monthLabel: 'נובמבר', year: 2027, month: 11, image: '/workouts/month-20.jpg', emoji: '🎯' },
  { index: 21, title: 'תוכנית קליעה', subtitle: 'Catch and Shoot', monthLabel: 'דצמבר', year: 2027, month: 12, image: '/workouts/month-21.jpg', emoji: '🔥' },
  { index: 22, title: 'תוכנית קליעה', subtitle: 'מתאמנים אישיים - Pro', monthLabel: 'ינואר', year: 2028, month: 1, image: '/workouts/month-22.jpg', emoji: '⭐' },
  { index: 23, title: 'עקיפה + קליעה', subtitle: 'מתקדמים Pro משולב', monthLabel: 'פברואר', year: 2028, month: 2, image: '/workouts/month-23.jpg', emoji: '⚡' },
  { index: 24, title: 'תוכנית קליעה', subtitle: 'Elite', monthLabel: 'מרץ', year: 2028, month: 3, image: '/workouts/month-24.jpg', emoji: '🏆' },
  { index: 25, title: 'תוכנית משולבת', subtitle: 'Elite - עקיפה וקליעה', monthLabel: 'אפריל', year: 2028, month: 4, image: '/workouts/month-25.jpg', emoji: '🏆' },
  { index: 26, title: 'כוח + קליעה', subtitle: 'Elite - כוח וקליעה', monthLabel: 'מאי', year: 2028, month: 5, image: '/workouts/month-26.jpg', emoji: '💪' },
  { index: 27, title: 'תוכנית סיום', subtitle: 'סיכום כולל - שליטה וקליעה', monthLabel: 'יוני', year: 2028, month: 6, image: '/workouts/month-27.jpg', emoji: '🏅' },
];

function isMonthUnlocked(year: number, month: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear) return true;
  if (year === currentYear && month <= currentMonth) return true;
  return false;
}

function isCurrentMonth(year: number, month: number): boolean {
  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth() + 1;
}

const WorkoutPlansPage = () => {
  const navigate = useNavigate();
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const toggleMonth = (index: number, unlocked: boolean) => {
    if (!unlocked) return;
    setExpandedMonth(expandedMonth === index ? null : index);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl gradient-accent shrink-0">
            <span className="text-lg font-black text-accent-foreground">I2</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 justify-end">
                <span>תוכניות עבודה</span>
                <Dumbbell className="h-6 w-6 text-accent" />
              </h1>
              <p className="text-sm text-muted-foreground">תוכנית חודשית מובנית - כל חודש נפתח בזמנו</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-3">
          {/* Timeline line */}
          <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          {WORKOUT_MONTHS.map((wm) => {
            const unlocked = isMonthUnlocked(wm.year, wm.month);
            const current = isCurrentMonth(wm.year, wm.month);
            const isExpanded = expandedMonth === wm.index;

            return (
              <div
                key={wm.index}
                className={`relative transition-all duration-300 ${current ? 'animate-fade-in' : ''}`}
              >
                {/* Timeline dot */}
                <div className={`absolute right-[18px] top-6 z-10 hidden md:flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                  current
                    ? 'bg-accent border-accent animate-pulse'
                    : unlocked
                      ? 'bg-primary border-primary'
                      : 'bg-muted border-border'
                }`}>
                  {!unlocked && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                </div>

                {/* Card */}
                <div className={`md:mr-12 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  current
                    ? 'border-accent/50 shadow-lg shadow-accent/10 bg-card'
                    : unlocked
                      ? 'border-border bg-card hover:border-accent/30 hover:shadow-md'
                      : 'border-border/40 bg-muted/30'
                }`}>
                  {/* Card Header - Always visible */}
                  <button
                    onClick={() => toggleMonth(wm.index, unlocked)}
                    className={`w-full p-4 md:p-5 flex items-center justify-between text-right ${
                      unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {unlocked ? (
                        isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <h3 className={`font-bold text-base md:text-lg ${
                            unlocked ? 'text-foreground' : 'text-muted-foreground/60'
                          }`}>
                            {wm.title}
                          </h3>
                          {current && (
                            <Badge className="gradient-accent text-accent-foreground text-[10px] px-1.5 py-0">
                              חודש נוכחי
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs md:text-sm ${
                          unlocked ? 'text-muted-foreground' : 'text-muted-foreground/40'
                        }`}>
                          {wm.subtitle}
                        </p>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <CalendarDays className={`h-3 w-3 ${unlocked ? 'text-accent' : 'text-muted-foreground/40'}`} />
                          <span className={`text-xs font-medium ${unlocked ? 'text-accent' : 'text-muted-foreground/40'}`}>
                            {wm.monthLabel} {wm.year}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl text-2xl shrink-0 ${
                        unlocked
                          ? current
                            ? 'bg-accent/20'
                            : 'bg-secondary'
                          : 'bg-muted/50 grayscale opacity-40'
                      }`}>
                        {wm.emoji}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && unlocked && (
                    <div className="px-4 pb-4 md:px-5 md:pb-5 animate-fade-in">
                      <div className="rounded-xl overflow-hidden border border-border/50 shadow-inner bg-background">
                        <img
                          src={wm.image}
                          alt={`${wm.title} - ${wm.subtitle}`}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        📋 תוכנית חודש {wm.index} מתוך {WORKOUT_MONTHS.length}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            🏀 Workout Plans by IDAN DANK · I2 Analytics
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlansPage;
