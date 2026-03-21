
-- Allow players to update their own sessions (scores, stats)
CREATE POLICY "Players can update own sessions"
ON public.sessions
FOR UPDATE
USING (player_id = auth.uid());

-- Allow players to insert actions on their own sessions
CREATE POLICY "Players can insert actions on own sessions"
ON public.game_actions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM sessions s
  WHERE s.id = game_actions.session_id AND s.player_id = auth.uid()
));

-- Allow players to update actions on their own sessions
CREATE POLICY "Players can update actions on own sessions"
ON public.game_actions
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM sessions s
  WHERE s.id = game_actions.session_id AND s.player_id = auth.uid()
));

-- Allow players to delete actions on their own sessions
CREATE POLICY "Players can delete actions on own sessions"
ON public.game_actions
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM sessions s
  WHERE s.id = game_actions.session_id AND s.player_id = auth.uid()
));
