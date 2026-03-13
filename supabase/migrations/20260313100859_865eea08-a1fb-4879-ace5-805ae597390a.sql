
-- Court IQ Categories
CREATE TABLE public.courtiq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#3b82f6',
  icon text DEFAULT '🏀',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.courtiq_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.courtiq_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches can insert categories" ON public.courtiq_categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches can update categories" ON public.courtiq_categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches can delete categories" ON public.courtiq_categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'coach'));

INSERT INTO public.courtiq_categories (name, color, icon) VALUES
  ('הבנת משחק', '#3b82f6', '🧠'),
  ('חוקים מורכבים', '#ef4444', '📏');

-- Court IQ Questions
CREATE TABLE public.courtiq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.courtiq_categories(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  media_url text,
  media_type text,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL,
  explanation text,
  publish_at timestamptz NOT NULL,
  expires_at timestamptz,
  created_by uuid NOT NULL,
  is_ai_generated boolean DEFAULT false,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.courtiq_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can do all on questions" ON public.courtiq_questions FOR ALL TO authenticated USING (has_role(auth.uid(), 'coach')) WITH CHECK (has_role(auth.uid(), 'coach'));

-- Validate question and auto-set expires_at
CREATE OR REPLACE FUNCTION public.validate_courtiq_question()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.correct_option NOT IN ('a','b','c','d') THEN
    RAISE EXCEPTION 'correct_option must be a, b, c, or d';
  END IF;
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.publish_at + interval '55 minutes';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_courtiq_question_trigger BEFORE INSERT OR UPDATE ON public.courtiq_questions FOR EACH ROW EXECUTE FUNCTION public.validate_courtiq_question();

-- Court IQ Answers
CREATE TABLE public.courtiq_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.courtiq_questions(id) ON DELETE CASCADE NOT NULL,
  player_id uuid NOT NULL,
  selected_option text NOT NULL,
  is_correct boolean NOT NULL,
  answer_time_ms integer NOT NULL,
  points_earned integer DEFAULT 0,
  answered_at timestamptz DEFAULT now(),
  UNIQUE(question_id, player_id)
);
ALTER TABLE public.courtiq_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players view own answers" ON public.courtiq_answers FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "Coaches view all answers" ON public.courtiq_answers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'coach'));

-- Court IQ Player Stats
CREATE TABLE public.courtiq_player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL UNIQUE,
  total_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  total_answered integer DEFAULT 0,
  questions_today integer DEFAULT 0,
  correct_streak integer DEFAULT 0,
  last_active_date date,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.courtiq_player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stats" ON public.courtiq_player_stats FOR SELECT TO authenticated USING (true);

-- Court IQ Suggestions
CREATE TABLE public.courtiq_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  question_text text NOT NULL,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_option text,
  category_id uuid REFERENCES public.courtiq_categories(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.courtiq_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players submit suggestions" ON public.courtiq_suggestions FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());
CREATE POLICY "Players view own suggestions" ON public.courtiq_suggestions FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "Coaches view all suggestions" ON public.courtiq_suggestions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches update suggestions" ON public.courtiq_suggestions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches delete suggestions" ON public.courtiq_suggestions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'coach'));

-- Function: Get active questions (hides correct_option)
CREATE OR REPLACE FUNCTION public.get_active_courtiq_questions()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'id', q.id, 'category_id', q.category_id, 'question_text', q.question_text,
    'media_url', q.media_url, 'media_type', q.media_type,
    'option_a', q.option_a, 'option_b', q.option_b, 'option_c', q.option_c, 'option_d', q.option_d,
    'publish_at', q.publish_at, 'expires_at', q.expires_at, 'created_at', q.created_at,
    'already_answered', EXISTS(SELECT 1 FROM courtiq_answers a WHERE a.question_id = q.id AND a.player_id = auth.uid()),
    'category_name', c.name, 'category_color', c.color, 'category_icon', c.icon
  ) ORDER BY q.publish_at DESC) INTO result
  FROM courtiq_questions q
  LEFT JOIN courtiq_categories c ON c.id = q.category_id
  WHERE q.publish_at <= now() AND q.expires_at > now();
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Function: Submit answer (server-side scoring)
CREATE OR REPLACE FUNCTION public.submit_courtiq_answer(
  _question_id uuid,
  _selected_option text,
  _answer_time_ms integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _correct text;
  _is_correct boolean;
  _points integer;
  _explanation text;
  _total_answers bigint;
  _correct_answers bigint;
  _player_id uuid;
  _today date;
  _old_date date;
  _old_questions_today integer;
  _old_streak integer;
  _new_streak integer;
  _old_correct_streak integer;
  _new_correct_streak integer;
  _daily_q_total bigint;
  _daily_a_count bigint;
  _bonus integer := 0;
  _found boolean;
BEGIN
  _player_id := auth.uid();
  _today := CURRENT_DATE;
  
  IF EXISTS (SELECT 1 FROM courtiq_answers WHERE question_id = _question_id AND player_id = _player_id) THEN
    RETURN jsonb_build_object('error', 'already_answered');
  END IF;
  
  SELECT correct_option, cq.explanation INTO _correct, _explanation
  FROM courtiq_questions cq WHERE cq.id = _question_id AND cq.publish_at <= now() AND cq.expires_at > now();
  
  IF _correct IS NULL THEN
    RETURN jsonb_build_object('error', 'question_expired');
  END IF;
  
  _is_correct := _selected_option = _correct;
  
  IF _is_correct THEN
    IF _answer_time_ms <= 5000 THEN _points := 100;
    ELSIF _answer_time_ms <= 10000 THEN _points := 75;
    ELSE _points := 50;
    END IF;
  ELSE
    _points := 0;
  END IF;
  
  INSERT INTO courtiq_answers (question_id, player_id, selected_option, is_correct, answer_time_ms, points_earned)
  VALUES (_question_id, _player_id, _selected_option, _is_correct, _answer_time_ms, _points);
  
  SELECT last_active_date, questions_today, current_streak, correct_streak
  INTO _old_date, _old_questions_today, _old_streak, _old_correct_streak
  FROM courtiq_player_stats WHERE player_id = _player_id;
  
  _found := FOUND;
  _new_correct_streak := CASE WHEN _is_correct THEN COALESCE(_old_correct_streak, 0) + 1 ELSE 0 END;
  
  IF NOT _found THEN
    _new_streak := 0;
    INSERT INTO courtiq_player_stats (player_id, total_points, current_streak, longest_streak, total_correct, total_answered, questions_today, correct_streak, last_active_date)
    VALUES (_player_id, _points, 0, 0, CASE WHEN _is_correct THEN 1 ELSE 0 END, 1, 1, _new_correct_streak, _today);
  ELSIF _old_date = _today THEN
    _new_streak := _old_streak;
    UPDATE courtiq_player_stats SET
      total_points = total_points + _points,
      total_correct = total_correct + CASE WHEN _is_correct THEN 1 ELSE 0 END,
      total_answered = total_answered + 1,
      questions_today = questions_today + 1,
      correct_streak = _new_correct_streak,
      longest_streak = GREATEST(longest_streak, _new_correct_streak),
      updated_at = now()
    WHERE player_id = _player_id;
  ELSE
    IF _old_date = _today - 1 AND _old_questions_today >= 3 THEN
      _new_streak := _old_streak + 1;
    ELSE
      _new_streak := 0;
    END IF;
    UPDATE courtiq_player_stats SET
      total_points = total_points + _points,
      current_streak = _new_streak,
      longest_streak = GREATEST(longest_streak, _new_streak),
      total_correct = total_correct + CASE WHEN _is_correct THEN 1 ELSE 0 END,
      total_answered = total_answered + 1,
      questions_today = 1,
      correct_streak = _new_correct_streak,
      last_active_date = _today,
      updated_at = now()
    WHERE player_id = _player_id;
  END IF;
  
  SELECT COUNT(*) INTO _daily_q_total FROM courtiq_questions WHERE publish_at::date = _today AND publish_at <= now();
  SELECT COUNT(*) INTO _daily_a_count FROM courtiq_answers a JOIN courtiq_questions q ON q.id = a.question_id WHERE a.player_id = _player_id AND q.publish_at::date = _today;
  
  IF _daily_a_count >= _daily_q_total AND _daily_q_total > 0 THEN
    _bonus := 200;
    UPDATE courtiq_player_stats SET total_points = total_points + _bonus WHERE player_id = _player_id;
  END IF;
  
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct) INTO _total_answers, _correct_answers
  FROM courtiq_answers WHERE question_id = _question_id;
  
  RETURN jsonb_build_object(
    'is_correct', _is_correct,
    'correct_option', _correct,
    'points_earned', _points,
    'bonus_points', _bonus,
    'explanation', _explanation,
    'total_answers', _total_answers,
    'correct_answers', _correct_answers,
    'correct_percentage', CASE WHEN _total_answers > 0 THEN ROUND((_correct_answers::numeric / _total_answers) * 100) ELSE 0 END,
    'correct_streak', _new_correct_streak,
    'daily_streak', COALESCE(_new_streak, 0)
  );
END;
$$;

-- Function: Leaderboard
CREATE OR REPLACE FUNCTION public.get_courtiq_leaderboard(_period text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_data ORDER BY (row_data->>'total_points')::bigint DESC) INTO result FROM (
    SELECT jsonb_build_object(
      'player_id', a.player_id,
      'display_name', p.display_name,
      'total_points', COALESCE(SUM(a.points_earned), 0)::bigint,
      'current_streak', COALESCE(s.current_streak, 0),
      'accuracy', CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(*) FILTER (WHERE a.is_correct)::numeric / COUNT(*) * 100, 1) ELSE 0 END
    ) as row_data
    FROM courtiq_answers a
    JOIN profiles p ON p.user_id = a.player_id
    LEFT JOIN courtiq_player_stats s ON s.player_id = a.player_id
    WHERE CASE 
      WHEN _period = 'daily' THEN a.answered_at::date = CURRENT_DATE
      WHEN _period = 'weekly' THEN a.answered_at >= date_trunc('week', CURRENT_TIMESTAMP)
      ELSE true
    END
    GROUP BY a.player_id, p.display_name, s.current_streak
  ) sub;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Enable realtime for live leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.courtiq_answers;
