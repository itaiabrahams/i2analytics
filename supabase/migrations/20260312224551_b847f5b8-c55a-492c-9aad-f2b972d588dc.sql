-- Add description field to player_challenges for custom challenge explanations
ALTER TABLE public.player_challenges ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- Add period_type to weekly_challenges (weekly, monthly, custom)
ALTER TABLE public.weekly_challenges ADD COLUMN IF NOT EXISTS period_type text NOT NULL DEFAULT 'weekly';

-- Allow players to insert shot_sessions (not just coaches)
CREATE POLICY "Players can create own shot sessions"
ON public.shot_sessions FOR INSERT TO authenticated
WITH CHECK (player_id = auth.uid());

-- Allow players to insert shots for their own sessions
CREATE POLICY "Players can insert own shots"
ON public.shots FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shot_sessions ss
    WHERE ss.id = shots.session_id AND ss.player_id = auth.uid()
  )
);

-- Allow players to update their own shot sessions
CREATE POLICY "Players can update own shot sessions"
ON public.shot_sessions FOR UPDATE TO authenticated
USING (player_id = auth.uid());