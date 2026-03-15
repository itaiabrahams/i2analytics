-- Allow coaches to view all shot sessions (including Basic players without coach_id)
DROP POLICY IF EXISTS "Coaches can view all shot sessions" ON public.shot_sessions;
CREATE POLICY "Coaches can view all shot sessions"
ON public.shot_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'coach'));

-- Allow coaches to view all shots tied to any player session
DROP POLICY IF EXISTS "Coaches can view all shots" ON public.shots;
CREATE POLICY "Coaches can view all shots"
ON public.shots
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'coach'));