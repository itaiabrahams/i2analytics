
-- Table for team coach feedback with unique token per player
CREATE TABLE public.team_coach_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  feedback_token uuid NOT NULL DEFAULT gen_random_uuid(),
  coach_name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'כללי',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feedback_token, id)
);

-- Create a separate table for the feedback token per player (one token per player)
CREATE TABLE public.team_coach_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL UNIQUE,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_coach_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_coach_tokens ENABLE ROW LEVEL SECURITY;

-- Tokens: players can see their own token, coaches can see tokens of their players
CREATE POLICY "Players can view own token" ON public.team_coach_tokens
  FOR SELECT TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Coaches can view player tokens" ON public.team_coach_tokens
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role));

-- Auto-create token for player on first access
CREATE POLICY "Players can create own token" ON public.team_coach_tokens
  FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());

-- Feedback: anyone with valid token can insert (via anon key)
CREATE POLICY "Anyone can insert feedback with valid token" ON public.team_coach_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_coach_tokens t
      WHERE t.player_id = team_coach_feedback.player_id
        AND t.token = team_coach_feedback.feedback_token
    )
  );

-- Players can view their own feedback
CREATE POLICY "Players can view own feedback" ON public.team_coach_feedback
  FOR SELECT TO authenticated
  USING (player_id = auth.uid());

-- Coaches can view feedback of their players
CREATE POLICY "Coaches can view player feedback" ON public.team_coach_feedback
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'coach'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = team_coach_feedback.player_id
        AND p.coach_id = auth.uid()
    )
  );

-- Add team_coach_approved column to profiles
ALTER TABLE public.profiles ADD COLUMN team_coach_approved boolean NOT NULL DEFAULT false;
