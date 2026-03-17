
-- Update get_active_courtiq_questions to include is_peak field
CREATE OR REPLACE FUNCTION public.get_active_courtiq_questions()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'id', q.id, 'category_id', q.category_id, 'question_text', q.question_text,
    'media_url', q.media_url, 'media_type', q.media_type,
    'option_a', q.option_a, 'option_b', q.option_b, 'option_c', q.option_c, 'option_d', q.option_d,
    'publish_at', q.publish_at, 'expires_at', q.expires_at, 'created_at', q.created_at,
    'is_peak', COALESCE(q.is_peak, false),
    'already_answered', EXISTS(SELECT 1 FROM courtiq_answers a WHERE a.question_id = q.id AND a.player_id = auth.uid()),
    'category_name', c.name, 'category_color', c.color, 'category_icon', c.icon
  ) ORDER BY q.publish_at DESC) INTO result
  FROM courtiq_questions q
  LEFT JOIN courtiq_categories c ON c.id = q.category_id
  WHERE q.publish_at <= now() AND q.expires_at > now();
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;
