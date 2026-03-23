
-- Allow players to delete their own shots (for sessions they own)
CREATE POLICY "Players can delete own shots"
ON public.shots
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shot_sessions ss
    WHERE ss.id = shots.session_id AND ss.player_id = auth.uid()
  )
);

-- Allow players to delete their own shot sessions
CREATE POLICY "Players can delete own shot sessions"
ON public.shot_sessions
FOR DELETE
TO authenticated
USING (player_id = auth.uid());
