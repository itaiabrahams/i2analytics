
-- Allow coaches to update other profiles' is_approved field
CREATE POLICY "Coaches can update approval status" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_head_coach(auth.uid()));
