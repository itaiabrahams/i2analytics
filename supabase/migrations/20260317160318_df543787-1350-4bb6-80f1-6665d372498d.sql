
-- Add new columns to player_challenges
ALTER TABLE public.player_challenges 
  ADD COLUMN IF NOT EXISTS target_made integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS challenger_note text DEFAULT '';
