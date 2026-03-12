
-- Shot tracking sessions
CREATE TABLE public.shot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  coach_id uuid,
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shot_sessions ENABLE ROW LEVEL SECURITY;

-- Individual shot records per zone
CREATE TABLE public.shots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.shot_sessions(id) ON DELETE CASCADE,
  zone text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  made integer NOT NULL DEFAULT 0,
  shot_type text NOT NULL DEFAULT 'catch_and_shoot',
  element text,
  finish_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shots ENABLE ROW LEVEL SECURITY;

-- RLS for shot_sessions
CREATE POLICY "Coaches can manage shot sessions"
ON public.shot_sessions FOR ALL TO authenticated
USING ((coach_id = auth.uid()) OR (player_id = auth.uid()))
WITH CHECK (has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Players can view own shot sessions"
ON public.shot_sessions FOR SELECT TO authenticated
USING (player_id = auth.uid());

-- RLS for shots
CREATE POLICY "Users can view shots of accessible sessions"
ON public.shots FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shot_sessions ss
    WHERE ss.id = shots.session_id
    AND (ss.coach_id = auth.uid() OR ss.player_id = auth.uid())
  )
);

CREATE POLICY "Coaches can insert shots"
ON public.shots FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Coaches can update shots"
ON public.shots FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shot_sessions ss
    WHERE ss.id = shots.session_id AND ss.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete shots"
ON public.shots FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shot_sessions ss
    WHERE ss.id = shots.session_id AND ss.coach_id = auth.uid()
  )
);

-- Allow demo data viewing
CREATE POLICY "Anyone can view demo shot sessions"
ON public.shot_sessions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = shot_sessions.player_id AND p.is_demo = true
  )
);

CREATE POLICY "Anyone can view demo shots"
ON public.shots FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shot_sessions ss
    JOIN public.profiles p ON p.user_id = ss.player_id
    WHERE ss.id = shots.session_id AND p.is_demo = true
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.shots;
