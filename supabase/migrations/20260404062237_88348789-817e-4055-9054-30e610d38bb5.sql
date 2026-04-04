CREATE POLICY "Coaches can update challenge entries"
ON public.challenge_entries
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'coach'::app_role))
WITH CHECK (has_role(auth.uid(), 'coach'::app_role));