
-- Head coaches can insert sessions for any player
CREATE POLICY "Head coaches can insert all sessions"
ON public.sessions FOR INSERT TO authenticated
WITH CHECK (is_head_coach(auth.uid()));

-- Head coaches can insert meetings for any player
CREATE POLICY "Head coaches can insert all meetings"
ON public.scheduled_meetings FOR INSERT TO authenticated
WITH CHECK (is_head_coach(auth.uid()));

-- Head coaches can insert goals for any player
CREATE POLICY "Head coaches can insert all goals"
ON public.player_goals FOR INSERT TO authenticated
WITH CHECK (is_head_coach(auth.uid()));

-- Head coaches can delete all goals
CREATE POLICY "Head coaches can delete all goals"
ON public.player_goals FOR DELETE TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can insert ratings for any player
CREATE POLICY "Head coaches can insert all ratings"
ON public.player_ratings FOR INSERT TO authenticated
WITH CHECK (is_head_coach(auth.uid()));

-- Head coaches can delete all ratings
CREATE POLICY "Head coaches can delete all ratings"
ON public.player_ratings FOR DELETE TO authenticated
USING (is_head_coach(auth.uid()));
