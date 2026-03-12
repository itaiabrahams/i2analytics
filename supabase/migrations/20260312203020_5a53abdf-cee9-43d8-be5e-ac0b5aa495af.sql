
-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  date DATE NOT NULL,
  opponent TEXT NOT NULL,
  video_url TEXT DEFAULT '',
  meeting_url TEXT DEFAULT '',
  coach_notes TEXT DEFAULT '',
  points INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  rebounds INTEGER NOT NULL DEFAULT 0,
  steals INTEGER NOT NULL DEFAULT 0,
  turnovers INTEGER NOT NULL DEFAULT 0,
  fg_percentage INTEGER NOT NULL DEFAULT 0,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches and players can view sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR player_id = auth.uid());

CREATE POLICY "Coaches can insert sessions" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can update their sessions" ON public.sessions
  FOR UPDATE TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their sessions" ON public.sessions
  FOR DELETE TO authenticated
  USING (coach_id = auth.uid());

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Game actions table
CREATE TABLE public.game_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL,
  minute INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_actions ENABLE ROW LEVEL SECURITY;

-- Actions inherit access from sessions (coach or player)
CREATE POLICY "Users can view actions of their sessions" ON public.game_actions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = game_actions.session_id
        AND (s.coach_id = auth.uid() OR s.player_id = auth.uid())
    )
  );

CREATE POLICY "Coaches can insert actions" ON public.game_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can update actions" ON public.game_actions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = game_actions.session_id
        AND s.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete actions" ON public.game_actions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = game_actions.session_id
        AND s.coach_id = auth.uid()
    )
  );
