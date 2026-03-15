-- Update the cron job to run every 5 minutes for reliability
SELECT cron.unschedule('auto-publish-courtiq-hourly');
SELECT cron.schedule(
  'auto-publish-courtiq-every-5min',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://mzlakkhodbqdhamjrhah.supabase.co/functions/v1/auto-publish-courtiq',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bGFra2hvZGJxZGhhbWpyaGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjQ5MzAsImV4cCI6MjA4ODkwMDkzMH0.Ctm9K1z-E2ckBZNB2fuKTZ5cTZKvDuXPeoAUTLoNQqk"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);