
-- Add bonus_points column to weekly_challenges
ALTER TABLE public.weekly_challenges 
  ADD COLUMN IF NOT EXISTS bonus_points integer DEFAULT 0;
