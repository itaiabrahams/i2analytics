
-- Head coaches can view ALL sessions
CREATE POLICY "Head coaches can view all sessions"
ON public.sessions FOR SELECT TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can update ALL sessions
CREATE POLICY "Head coaches can update all sessions"
ON public.sessions FOR UPDATE TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can delete ALL sessions
CREATE POLICY "Head coaches can delete all sessions"
ON public.sessions FOR DELETE TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can view ALL game actions
CREATE POLICY "Head coaches can view all game actions"
ON public.game_actions FOR SELECT TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can update ALL game actions
CREATE POLICY "Head coaches can update all game actions"
ON public.game_actions FOR UPDATE TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can delete ALL game actions
CREATE POLICY "Head coaches can delete all game actions"
ON public.game_actions FOR DELETE TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can insert game actions
CREATE POLICY "Head coaches can insert all game actions"
ON public.game_actions FOR INSERT TO authenticated
WITH CHECK (is_head_coach(auth.uid()));

-- Head coaches can view ALL scheduled meetings
CREATE POLICY "Head coaches can view all meetings"
ON public.scheduled_meetings FOR SELECT TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can manage ALL scheduled meetings
CREATE POLICY "Head coaches can update all meetings"
ON public.scheduled_meetings FOR UPDATE TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can delete ALL scheduled meetings
CREATE POLICY "Head coaches can delete all meetings"
ON public.scheduled_meetings FOR DELETE TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can view ALL player goals
CREATE POLICY "Head coaches can view all goals"
ON public.player_goals FOR SELECT TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can update ALL player goals
CREATE POLICY "Head coaches can update all goals"
ON public.player_goals FOR UPDATE TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can view ALL player ratings
CREATE POLICY "Head coaches can view all ratings"
ON public.player_ratings FOR SELECT TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can update ALL player ratings
CREATE POLICY "Head coaches can update all ratings"
ON public.player_ratings FOR UPDATE TO authenticated
USING (is_head_coach(auth.uid()));

-- Head coaches can view ALL team coach feedback
CREATE POLICY "Head coaches can view all feedback"
ON public.team_coach_feedback FOR SELECT TO authenticated
USING (is_head_coach(auth.uid()));
