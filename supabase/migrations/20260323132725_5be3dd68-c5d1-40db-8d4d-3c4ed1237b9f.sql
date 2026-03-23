
-- Add status column to sessions table
ALTER TABLE public.sessions ADD COLUMN status text NOT NULL DEFAULT 'open';

-- Update existing sessions to 'completed' since they were created before this feature
UPDATE public.sessions SET status = 'completed';
