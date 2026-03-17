
CREATE OR REPLACE FUNCTION public.submit_courtiq_answer(_question_id uuid, _selected_option text, _answer_time_ms integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  _is_peak boolean;
  _multiplier integer;
BEGIN
  _player_id := auth.uid();
  _today := CURRENT_DATE;
  
  IF EXISTS (SELECT 1 FROM courtiq_answers WHERE question_id = _question_id AND player_id = _player_id) THEN
    RETURN jsonb_build_object('error', 'already_answered');
  END IF;
  
  SELECT correct_option, cq.explanation, COALESCE(cq.is_peak, false) INTO _correct, _explanation, _is_peak
  FROM courtiq_questions cq WHERE cq.id = _question_id AND cq.publish_at <= now() AND cq.expires_at > now();
  
  IF _correct IS NULL THEN
    RETURN jsonb_build_object('error', 'question_expired');
  END IF;
  
  _is_correct := _selected_option = _correct;
  _multiplier := CASE WHEN _is_peak THEN 2 ELSE 1 END;
  
  IF _is_correct THEN
    IF _answer_time_ms <= 5000 THEN _points := 100 * _multiplier;
    ELSIF _answer_time_ms <= 10000 THEN _points := 75 * _multiplier;
    ELSE _points := 50 * _multiplier;
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
    'daily_streak', COALESCE(_new_streak, 0),
    'is_peak', _is_peak,
    'multiplier', _multiplier
  );
END;
$function$;
