
-- Add approval status to profiles
ALTER TABLE public.profiles ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;

-- Create a function to check approval status (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;

-- Create function to check if user is head coach (first approved coach)
CREATE OR REPLACE FUNCTION public.is_head_coach(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND role = 'coach'
      AND is_approved = true
  )
$$;
