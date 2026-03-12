
-- Player ratings: weekly/monthly evaluations by coach
CREATE TABLE public.player_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  player_id UUID NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'weekly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  overall_rating INTEGER NOT NULL DEFAULT 5,
  offense_rating INTEGER NOT NULL DEFAULT 5,
  defense_rating INTEGER NOT NULL DEFAULT 5,
  teamwork_rating INTEGER NOT NULL DEFAULT 5,
  effort_rating INTEGER NOT NULL DEFAULT 5,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches and players can view ratings" ON public.player_ratings
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR player_id = auth.uid());

CREATE POLICY "Coaches can manage ratings" ON public.player_ratings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can update their ratings" ON public.player_ratings
  FOR UPDATE TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their ratings" ON public.player_ratings
  FOR DELETE TO authenticated
  USING (coach_id = auth.uid());

CREATE TRIGGER update_player_ratings_updated_at
  BEFORE UPDATE ON public.player_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Player goals: targets set by coach with progress tracking
CREATE TABLE public.player_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  player_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  target_date DATE,
  category TEXT NOT NULL DEFAULT 'כללי',
  status TEXT NOT NULL DEFAULT 'active',
  progress INTEGER NOT NULL DEFAULT 0,
  progress_notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches and players can view goals" ON public.player_goals
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR player_id = auth.uid());

CREATE POLICY "Coaches can manage goals" ON public.player_goals
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can update goals" ON public.player_goals
  FOR UPDATE TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete goals" ON public.player_goals
  FOR DELETE TO authenticated
  USING (coach_id = auth.uid());

CREATE TRIGGER update_player_goals_updated_at
  BEFORE UPDATE ON public.player_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
