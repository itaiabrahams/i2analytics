ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS sport text NOT NULL DEFAULT 'basketball';

COMMENT ON COLUMN public.games.sport IS
  'Which app owns this game. Football games carry their events in game_events; basketball games use the older game_tags.';

CREATE INDEX IF NOT EXISTS games_sport_player_idx ON public.games (sport, player_id, date DESC);

CREATE TABLE IF NOT EXISTS public.game_events (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id  uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  period       smallint NOT NULL DEFAULT 1 CHECK (period BETWEEN 1 AND 6),
  clock_minute smallint NOT NULL CHECK (clock_minute BETWEEN 0 AND 150),
  clock_second smallint NOT NULL DEFAULT 0 CHECK (clock_second BETWEEN 0 AND 59),
  video_timestamp_seconds numeric,
  tag_id uuid NOT NULL REFERENCES public.taxonomy_tags(id),
  phase_key    text NOT NULL,
  category_key text NOT NULL,
  tag_key      text NOT NULL,
  zone_key text,
  outcome_set_key text,
  outcome_value   text,
  field_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  score smallint NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT game_events_field_values_is_object
    CHECK (jsonb_typeof(field_values) = 'object')
);

CREATE INDEX IF NOT EXISTS game_events_game_idx     ON public.game_events (game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS game_events_clock_idx    ON public.game_events (game_id, period, clock_minute, clock_second);
CREATE INDEX IF NOT EXISTS game_events_tag_idx      ON public.game_events (tag_id);
CREATE INDEX IF NOT EXISTS game_events_player_idx   ON public.game_events (player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS game_events_taxonomy_idx ON public.game_events (player_id, phase_key, category_key);

ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Game events visible to game participants" ON public.game_events;
CREATE POLICY "Game events visible to game participants"
  ON public.game_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_events.game_id
        AND (g.coach_id = auth.uid() OR g.player_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owning coach writes game events" ON public.game_events;
CREATE POLICY "Owning coach writes game events"
  ON public.game_events FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_events.game_id AND g.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_events.game_id AND g.coach_id = auth.uid()
    )
  );

REVOKE ALL ON public.game_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_events TO authenticated;
GRANT ALL ON public.game_events TO service_role;

ALTER TABLE public.game_events REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'game_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_events;
  END IF;
END $$;