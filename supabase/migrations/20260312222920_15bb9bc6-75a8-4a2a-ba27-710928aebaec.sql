
-- Weekly challenges table
CREATE TABLE public.weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  zone text DEFAULT NULL,
  target_percentage integer DEFAULT 50,
  target_attempts integer DEFAULT 20,
  week_start date NOT NULL DEFAULT (date_trunc('week', CURRENT_DATE))::date,
  week_end date NOT NULL DEFAULT (date_trunc('week', CURRENT_DATE) + interval '6 days')::date,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view weekly challenges" ON public.weekly_challenges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches can create weekly challenges" ON public.weekly_challenges
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can delete their challenges" ON public.weekly_challenges
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Player-vs-player challenges
CREATE TABLE public.player_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL,
  challenged_id uuid NOT NULL,
  zone text DEFAULT NULL,
  target_attempts integer DEFAULT 20,
  status text NOT NULL DEFAULT 'pending',
  challenger_attempts integer DEFAULT 0,
  challenger_made integer DEFAULT 0,
  challenged_attempts integer DEFAULT 0,
  challenged_made integer DEFAULT 0,
  winner_id uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.player_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their challenges" ON public.player_challenges
  FOR SELECT TO authenticated USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

CREATE POLICY "Players can create challenges" ON public.player_challenges
  FOR INSERT TO authenticated WITH CHECK (challenger_id = auth.uid());

CREATE POLICY "Participants can update challenges" ON public.player_challenges
  FOR UPDATE TO authenticated USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

-- Weekly challenge leaderboard entries
CREATE TABLE public.challenge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  attempts integer DEFAULT 0,
  made integer DEFAULT 0,
  percentage numeric DEFAULT 0,
  video_url text DEFAULT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, player_id)
);

ALTER TABLE public.challenge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view challenge entries" ON public.challenge_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Players can submit entries" ON public.challenge_entries
  FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());

CREATE POLICY "Players can update own entries" ON public.challenge_entries
  FOR UPDATE TO authenticated USING (player_id = auth.uid());

-- Add video_url column to shot_sessions
ALTER TABLE public.shot_sessions ADD COLUMN video_url text DEFAULT NULL;

-- Create storage bucket for shot videos
INSERT INTO storage.buckets (id, name, public) VALUES ('shot-videos', 'shot-videos', true);

-- Storage policies for shot-videos bucket
CREATE POLICY "Authenticated users can upload shot videos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shot-videos');

CREATE POLICY "Anyone can view shot videos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'shot-videos');

CREATE POLICY "Users can delete own shot videos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'shot-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
