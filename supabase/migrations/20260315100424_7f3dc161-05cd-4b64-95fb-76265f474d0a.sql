
-- Table for player technique videos
CREATE TABLE public.player_technique_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'form',
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_technique_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own technique videos" ON public.player_technique_videos
  FOR SELECT TO authenticated USING (player_id = auth.uid());

CREATE POLICY "Players can insert own technique videos" ON public.player_technique_videos
  FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());

CREATE POLICY "Players can delete own technique videos" ON public.player_technique_videos
  FOR DELETE TO authenticated USING (player_id = auth.uid());

CREATE POLICY "Coaches can view player technique videos" ON public.player_technique_videos
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'coach'));

-- Add video columns to player_challenges
ALTER TABLE public.player_challenges ADD COLUMN IF NOT EXISTS challenger_video_url TEXT;
ALTER TABLE public.player_challenges ADD COLUMN IF NOT EXISTS challenged_video_url TEXT;
