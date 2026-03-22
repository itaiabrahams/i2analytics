import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, ChevronDown, ChevronUp, Dumbbell, CalendarDays, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isCombinedWorkout } from '@/lib/shootingDrills';
import ShootingDrillsCard from '@/components/ShootingDrillsCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import WorkoutEditDialog from '@/components/WorkoutEditDialog';

interface WorkoutPlan {
  id: string;
  month_index: number;
  title: string;
  subtitle: string;
  month_label: string;
  year: number;
  month: number;
  emoji: string;
  image_url: string | null;
  shooting_image_url: string | null;
}

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
  const { role } = useAuth();
  const isCoach = role === 'coach';
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .order('month_index', { ascending: true });
    if (data) setPlans(data as WorkoutPlan[]);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const toggleMonth = (index: number, unlocked: boolean) => {
    if (!unlocked) return;
    setExpandedMonth(expandedMonth === index ? null : index);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">טוען תוכניות...</p>
      </div>
    );
  }

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
          <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          {plans.map((wm) => {
            const unlocked = isMonthUnlocked(wm.year, wm.month);
            const current = isCurrentMonth(wm.year, wm.month);
            const isExpanded = expandedMonth === wm.month_index;

            return (
              <div key={wm.month_index} className={`relative transition-all duration-300 ${current ? 'animate-fade-in' : ''}`}>
                {/* Timeline dot */}
                <div className={`absolute right-[18px] top-6 z-10 hidden md:flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                  current ? 'bg-accent border-accent animate-pulse' : unlocked ? 'bg-primary border-primary' : 'bg-muted border-border'
                }`}>
                  {!unlocked && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                </div>

                {/* Card */}
                <div className={`md:mr-12 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  current ? 'border-accent/50 shadow-lg shadow-accent/10 bg-card' : unlocked ? 'border-border bg-card hover:border-accent/30 hover:shadow-md' : 'border-border/40 bg-muted/30'
                }`}>
                  <button
                    onClick={() => toggleMonth(wm.month_index, unlocked)}
                    className={`w-full p-4 md:p-5 flex items-center justify-between text-right ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-2">
                      {isCoach && unlocked && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent"
                          onClick={(e) => { e.stopPropagation(); setEditingPlan(wm); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {unlocked ? (
                        isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <h3 className={`font-bold text-base md:text-lg ${unlocked ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                            {wm.title}
                          </h3>
                          {current && (
                            <Badge className="gradient-accent text-accent-foreground text-[10px] px-1.5 py-0">חודש נוכחי</Badge>
                          )}
                        </div>
                        <p className={`text-xs md:text-sm ${unlocked ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                          {wm.subtitle}
                        </p>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <CalendarDays className={`h-3 w-3 ${unlocked ? 'text-accent' : 'text-muted-foreground/40'}`} />
                          <span className={`text-xs font-medium ${unlocked ? 'text-accent' : 'text-muted-foreground/40'}`}>
                            {wm.month_label} {wm.year}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl text-2xl shrink-0 ${
                        unlocked ? current ? 'bg-accent/20' : 'bg-secondary' : 'bg-muted/50 grayscale opacity-40'
                      }`}>
                        {wm.emoji}
                      </div>
                    </div>
                  </button>

                  {isExpanded && unlocked && (
                    <div className="px-4 pb-4 md:px-5 md:pb-5 animate-fade-in space-y-4">
                      {wm.image_url && (
                        <div className="rounded-xl overflow-hidden border border-border/50 shadow-inner bg-background">
                          <img src={wm.image_url} alt={`${wm.title} - ${wm.subtitle}`} className="w-full h-auto" loading="lazy" />
                        </div>
                      )}

                      {!wm.image_url && (
                        <div className="rounded-xl overflow-hidden border border-border/50 shadow-inner bg-background">
                          <img src={`/workouts/month-${String(wm.month_index).padStart(2, '0')}.jpg`} alt={`${wm.title}`} className="w-full h-auto" loading="lazy" />
                        </div>
                      )}

                      {wm.shooting_image_url && (
                        <div className="rounded-xl overflow-hidden border border-border/50 shadow-inner bg-background">
                          <img src={wm.shooting_image_url} alt={`קליעה - ${wm.subtitle}`} className="w-full h-auto" loading="lazy" />
                        </div>
                      )}

                      {isCombinedWorkout(wm.title) && <ShootingDrillsCard monthIndex={wm.month_index} />}

                      <p className="text-xs text-muted-foreground text-center mt-3">
                        📋 תוכנית חודש {wm.month_index} מתוך {plans.length}
                        {isCombinedWorkout(wm.title) && ' · כולל דף קליעה'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">🏀 Workout Plans by IDAN DANK · I2 Analytics</p>
        </div>
      </div>

      {editingPlan && (
        <WorkoutEditDialog
          plan={editingPlan}
          open={!!editingPlan}
          onOpenChange={(open) => { if (!open) setEditingPlan(null); }}
          onSaved={() => { setEditingPlan(null); fetchPlans(); }}
        />
      )}
    </div>
  );
};

export default WorkoutPlansPage;
