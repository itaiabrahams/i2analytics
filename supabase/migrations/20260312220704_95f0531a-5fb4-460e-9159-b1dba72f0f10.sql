
-- Allow all authenticated users to view demo player's sessions
CREATE POLICY "Anyone can view demo sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = sessions.player_id 
    AND p.is_demo = true
  )
);

-- Allow all authenticated users to view demo player's game actions
CREATE POLICY "Anyone can view demo game actions"
ON public.game_actions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions s 
    JOIN profiles p ON p.user_id = s.player_id 
    WHERE s.id = game_actions.session_id 
    AND p.is_demo = true
  )
);
