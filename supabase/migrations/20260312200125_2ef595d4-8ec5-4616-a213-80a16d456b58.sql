
-- Scheduled meetings table
CREATE TABLE public.scheduled_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  player_id UUID NOT NULL,
  title TEXT NOT NULL,
  meeting_url TEXT DEFAULT '',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_meetings ENABLE ROW LEVEL SECURITY;

-- Coaches can CRUD their own meetings
CREATE POLICY "Coaches can manage their meetings" ON public.scheduled_meetings
  FOR ALL TO authenticated
  USING (coach_id = auth.uid() OR player_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'meeting',
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Coaches can insert notifications for players
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger for updated_at on scheduled_meetings
CREATE TRIGGER update_scheduled_meetings_updated_at
  BEFORE UPDATE ON public.scheduled_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
