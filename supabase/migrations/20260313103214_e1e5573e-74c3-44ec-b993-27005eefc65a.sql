
-- Enable pg_cron and pg_net for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create settings table for auto-publish control
CREATE TABLE IF NOT EXISTS public.courtiq_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_publish_enabled boolean NOT NULL DEFAULT true,
  publish_start_hour integer NOT NULL DEFAULT 9,
  publish_end_hour integer NOT NULL DEFAULT 22,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.courtiq_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courtiq settings" ON public.courtiq_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches can update courtiq settings" ON public.courtiq_settings
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'coach'))
  WITH CHECK (has_role(auth.uid(), 'coach'));

-- Insert default settings row
INSERT INTO public.courtiq_settings (auto_publish_enabled) VALUES (true);
