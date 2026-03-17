
-- Add is_peak column to courtiq_questions for marking peak questions
ALTER TABLE public.courtiq_questions 
  ADD COLUMN IF NOT EXISTS is_peak boolean DEFAULT false;
