
-- Fix: restrict notification inserts to coaches only
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Coaches can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coach'));
