
-- Allow coaches to view player_challenges of demo players
CREATE POLICY "Coaches can view demo player challenges"
ON public.player_challenges FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'coach'::app_role)
  AND (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = player_challenges.challenger_id AND p.is_demo = true)
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = player_challenges.challenged_id AND p.is_demo = true)
  )
);

-- Allow coaches to view player_challenges of their own players
CREATE POLICY "Coaches can view their players challenges"
ON public.player_challenges FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'coach'::app_role)
  AND (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = player_challenges.challenger_id AND p.coach_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = player_challenges.challenged_id AND p.coach_id = auth.uid())
  )
);
