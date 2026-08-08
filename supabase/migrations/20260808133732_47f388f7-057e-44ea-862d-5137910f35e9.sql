-- =============================================================================
-- Sport-agnostic tagging taxonomy + football/basketball seed
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Access flag for this app
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS football_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.football_enabled IS
  'True when a coach has explicitly added this user to the I2 Football app.';

CREATE OR REPLACE FUNCTION public.enable_player_football(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'coach' AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Only approved coaches can grant football access';
  END IF;

  UPDATE public.profiles
     SET football_enabled = true
   WHERE user_id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enable_player_football(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Taxonomy tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.taxonomy_phases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport       text NOT NULL,
  key         text NOT NULL,
  label_he    text NOT NULL,
  color_token text NOT NULL DEFAULT 'slate',
  sort_order  integer NOT NULL DEFAULT 0,
  UNIQUE (sport, key)
);

GRANT SELECT ON public.taxonomy_phases TO authenticated;
GRANT ALL ON public.taxonomy_phases TO service_role;

CREATE TABLE IF NOT EXISTS public.taxonomy_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id        uuid NOT NULL REFERENCES public.taxonomy_phases(id) ON DELETE CASCADE,
  key             text NOT NULL,
  label_he        text NOT NULL,
  state           text CHECK (state IN ('with_ball', 'without_ball')),
  outcome_set_key text NOT NULL DEFAULT 'general',
  sort_order      integer NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  UNIQUE (phase_id, key)
);

GRANT SELECT ON public.taxonomy_categories TO authenticated;
GRANT ALL ON public.taxonomy_categories TO service_role;

CREATE TABLE IF NOT EXISTS public.taxonomy_tags (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    uuid NOT NULL REFERENCES public.taxonomy_categories(id) ON DELETE CASCADE,
  key            text NOT NULL,
  code           text NOT NULL,
  label_he       text NOT NULL,
  description_he text NOT NULL DEFAULT '',
  default_score  smallint NOT NULL DEFAULT 0,
  sort_order     integer NOT NULL DEFAULT 0,
  active         boolean NOT NULL DEFAULT true,
  UNIQUE (category_id, key)
);

GRANT SELECT ON public.taxonomy_tags TO authenticated;
GRANT ALL ON public.taxonomy_tags TO service_role;

CREATE TABLE IF NOT EXISTS public.taxonomy_fields (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport              text NOT NULL,
  key                text NOT NULL,
  label_he           text NOT NULL,
  target_tag_id      uuid REFERENCES public.taxonomy_tags(id) ON DELETE CASCADE,
  target_category_id uuid REFERENCES public.taxonomy_categories(id) ON DELETE CASCADE,
  required           boolean NOT NULL DEFAULT false,
  sort_order         integer NOT NULL DEFAULT 0,
  UNIQUE (sport, key),
  CONSTRAINT taxonomy_fields_one_target CHECK (
    (target_tag_id IS NOT NULL)::int + (target_category_id IS NOT NULL)::int = 1
  )
);

GRANT SELECT ON public.taxonomy_fields TO authenticated;
GRANT ALL ON public.taxonomy_fields TO service_role;

CREATE TABLE IF NOT EXISTS public.taxonomy_field_options (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id   uuid NOT NULL REFERENCES public.taxonomy_fields(id) ON DELETE CASCADE,
  value      text NOT NULL,
  label_he   text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (field_id, value)
);

GRANT SELECT ON public.taxonomy_field_options TO authenticated;
GRANT ALL ON public.taxonomy_field_options TO service_role;

CREATE TABLE IF NOT EXISTS public.taxonomy_outcomes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport      text NOT NULL,
  set_key    text NOT NULL,
  value      text NOT NULL,
  label_he   text NOT NULL,
  polarity   smallint NOT NULL DEFAULT 0 CHECK (polarity BETWEEN -1 AND 1),
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (sport, set_key, value)
);

GRANT SELECT ON public.taxonomy_outcomes TO authenticated;
GRANT ALL ON public.taxonomy_outcomes TO service_role;

CREATE TABLE IF NOT EXISTS public.taxonomy_zones (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport      text NOT NULL,
  key        text NOT NULL,
  label_he   text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (sport, key)
);

GRANT SELECT ON public.taxonomy_zones TO authenticated;
GRANT ALL ON public.taxonomy_zones TO service_role;

CREATE INDEX IF NOT EXISTS taxonomy_categories_phase_idx ON public.taxonomy_categories (phase_id, sort_order);
CREATE INDEX IF NOT EXISTS taxonomy_tags_category_idx    ON public.taxonomy_tags (category_id, sort_order);

-- -----------------------------------------------------------------------------
-- 3. RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.taxonomy_phases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_fields        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_outcomes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_zones         ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'taxonomy_phases','taxonomy_categories','taxonomy_tags',
    'taxonomy_fields','taxonomy_field_options','taxonomy_outcomes','taxonomy_zones'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Taxonomy is readable by authenticated" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Taxonomy is readable by authenticated" ON public.%I
         FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- =============================================================================
-- 4. FOOTBALL SEED
-- =============================================================================
INSERT INTO public.taxonomy_phases (sport, key, label_he, color_token, sort_order) VALUES
  ('football', 'attack',     'התקפה', 'amber',  1),
  ('football', 'defense',    'הגנה',  'sky',    2),
  ('football', 'transition', 'מעברים','violet', 3)
ON CONFLICT (sport, key) DO UPDATE
  SET label_he = EXCLUDED.label_he,
      color_token = EXCLUDED.color_token,
      sort_order = EXCLUDED.sort_order;

INSERT INTO public.taxonomy_categories (phase_id, key, label_he, state, outcome_set_key, sort_order)
SELECT p.id, v.key, v.label_he, v.state, v.outcome_set_key, v.sort_order
FROM (VALUES
  ('attack',     'pass',                 'מסירה',                            'with_ball',    'attacking', 1),
  ('attack',     'receiving',            'קבלת כדור',                        'with_ball',    'attacking', 2),
  ('attack',     'first_touch',          'נגיעה ראשונה',                     'with_ball',    'attacking', 3),
  ('attack',     'carry_dribble',        'הובלת כדור / דריבל',               'with_ball',    'attacking', 4),
  ('attack',     'shooting',             'בעיטה / סיומות',                   'with_ball',    'shot',      5),
  ('attack',     'off_ball_movement',    'תנועה לקבלה / תנועות בלי הכדור',   'without_ball', 'attacking', 6),
  ('defense',    'individual_defending', 'פעולות הגנתיות אישיות',            'without_ball', 'defensive', 1),
  ('transition', 'attack_to_defense',    'מעבר מהתקפה להגנה',                NULL,           'defensive', 1),
  ('transition', 'defense_to_attack',    'מעבר מהגנה להתקפה',                NULL,           'attacking', 2)
) AS v(phase_key, key, label_he, state, outcome_set_key, sort_order)
JOIN public.taxonomy_phases p ON p.key = v.phase_key AND p.sport = 'football'
ON CONFLICT (phase_id, key) DO UPDATE
  SET label_he = EXCLUDED.label_he,
      state = EXCLUDED.state,
      outcome_set_key = EXCLUDED.outcome_set_key,
      sort_order = EXCLUDED.sort_order,
      active = true;

INSERT INTO public.taxonomy_tags (category_id, key, code, label_he, sort_order)
SELECT c.id, v.key, v.code, v.label_he, v.sort_order
FROM (VALUES
  ('pass', 'pass_width',            'רוחב',        'מסירת רוחב',        1),
  ('pass', 'pass_progressive',      'מקדמת',       'מסירה מקדמת',       2),
  ('pass', 'pass_between_lines',    'בין קווים',   'מסירה בין קווים',   3),
  ('pass', 'pass_through',          'עומק',        'מסירת עומק',        4),
  ('pass', 'pass_key',              'מפתח',        'מסירת מפתח',        5),
  ('pass', 'pass_switch',           'שינוי צד',    'שינוי צד',          6),
  ('pass', 'pass_wall',             'קיר',         'מסירת קיר',         7),
  ('pass', 'pass_cross',            'קרוס',        'קרוס / הרמה',       8),
  ('receiving', 'receive_back_to_play',  'גב',    'גב למשחק',    1),
  ('receiving', 'receive_facing_play',   'פנים',  'פנים למשחק',  2),
  ('receiving', 'receive_under_pressure','לחץ',   'תחת לחץ',     3),
  ('receiving', 'receive_to_feet',       'לרגל',  'לרגל',        4),
  ('receiving', 'receive_to_space',      'לשטח',  'לשטח',        5),
  ('first_touch', 'touch_forward',         'קדימה',   'נגיעה קדימה',           1),
  ('first_touch', 'touch_backward',        'אחורה',   'נגיעה אחורה',           2),
  ('first_touch', 'touch_sideways',        'לצד',     'נגיעה לצד',             3),
  ('first_touch', 'touch_escape_pressure', 'בריחה',   'נגיעה לבריחה מלחץ',     4),
  ('first_touch', 'touch_poor',            'לא טובה', 'נגיעה לא טובה',         5),
  ('carry_dribble', 'carry_forward',        'קדימה',      'הובלת כדור קדימה',        1),
  ('carry_dribble', 'carry_sideways',       'לצד',        'הובלת כדור לצד',          2),
  ('carry_dribble', 'carry_under_pressure', 'תחת לחץ',    'הובלת כדור תחת לחץ',      3),
  ('carry_dribble', 'carry_line_break',     'שבירת קו',   'הובלת כדור לשבירת קו',    4),
  ('carry_dribble', 'carry_switch',         'שינוי צד',   'הובלת כדור לשינוי צד',    5),
  ('carry_dribble', 'carry_no_progress',    'ללא קידום',  'הובלת כדור ללא קידום',    6),
  ('carry_dribble', 'carry_into_traffic',   'לצפיפות',    'הובלת כדור לתוך צפיפות',  7),
  ('carry_dribble', 'one_v_one_success',    '1 על 1 ✓',   '1 על 1 מוצלח',            8),
  ('carry_dribble', 'one_v_one_fail',       '1 על 1 ✗',   '1 על 1 לא מוצלח',         9),
  ('shooting', 'shot_inside_box',     'ברחבה',          'בעיטה מתוך הרחבה',     1),
  ('shooting', 'shot_outside_box',    'מחוץ לרחבה',     'בעיטה מחוץ לרחבה',     2),
  ('shooting', 'shot_first_time',     'בנגיעה',         'בעיטה בנגיעה',         3),
  ('shooting', 'shot_after_control',  'אחרי השתלטות',   'בעיטה אחרי השתלטות',   4),
  ('shooting', 'shot_after_dribble',  'אחרי דריבל',     'בעיטה אחרי דריבל',     5),
  ('shooting', 'shot_under_pressure', 'תחת לחץ',        'בעיטה תחת לחץ',        6),
  ('shooting', 'shot_one_on_one_gk',  'מול שוער',       'סיומת מול שוער',       7),
  ('shooting', 'header_on_goal',      'נגיחה',          'נגיחה לשער',           8),
  ('off_ball_movement', 'open_passing_angle',     'זווית',     'פתיחת זווית מסירה',  1),
  ('off_ball_movement', 'support',                'תמיכה',     'תמיכה',              2),
  ('off_ball_movement', 'movement_between_lines', 'בין קווים', 'תנועה בין הקווים',   3),
  ('off_ball_movement', 'run_in_behind',          'עומק',      'תנועת עומק',         4),
  ('off_ball_movement', 'run_into_box',           'לרחבה',     'תנועה לרחבה',        5),
  ('off_ball_movement', 'clear_space',            'פינוי',     'פינוי שטח',          6),
  ('off_ball_movement', 'positioning_good',       'מיקום ✓',   'מיקום טוב',          7),
  ('off_ball_movement', 'positioning_improve',    'מיקום ✗',   'מיקום לשיפור',       8),
  ('individual_defending', 'press_ball_carrier',    'לחץ',         'לחץ על מוביל כדור',  1),
  ('individual_defending', 'close_passing_angle',   'סגירת זווית', 'סגירת זווית מסירה',  2),
  ('individual_defending', 'duel',                  'מאבק',        'מאבק',               3),
  ('individual_defending', 'aerial_duel',           'אוויר',       'מאבק אוויר',         4),
  ('individual_defending', 'tackle',                'תיקול',       'תיקול',              5),
  ('individual_defending', 'tactical_foul_defense', 'עבירה',       'עבירה טקטית',        6),
  ('individual_defending', 'interception',          'יירוט',       'יירוט מסירה',        7),
  ('individual_defending', 'steering',              'הכוונה',      'הכוונה',             8),
  ('individual_defending', 'one_v_one_defending',   '1 על 1',      '1 על 1 הגנתי',       9),
  ('individual_defending', 'marking_in_box',        'ברחבה',       'שמירה ברחבה',        10),
  ('individual_defending', 'zonal_marking',         'איזורית',     'שמירה איזורית',      11),
  ('individual_defending', 'man_marking',           'אישית',       'שמירה אישית',        12),
  ('attack_to_defense', 'reaction_to_loss',              'תגובה',         'תגובה לאיבוד',                    1),
  ('attack_to_defense', 'press_after_loss',              'לחץ',           'לחץ אחרי איבוד',                  2),
  ('attack_to_defense', 'immediate_recovery_attempt',    'חילוץ מיידי',   'ניסיון חילוץ מיידי',              3),
  ('attack_to_defense', 'recover_position',              'לעמדה',         'חזרה לעמדה',                      4),
  ('attack_to_defense', 'recover_to_defense',            'להגנה',         'חזרה להגנה',                      5),
  ('attack_to_defense', 'stop_the_break',                'עצירת מתפרצת',  'עצירת מתפרצת',                    6),
  ('attack_to_defense', 'tactical_foul_transition',      'עבירה',         'עבירה טקטית',                     7),
  ('attack_to_defense', 'close_free_player',             'שחקן חופשי',    'סגירת שחקן חופשי',                8),
  ('attack_to_defense', 'close_passing_lane_after_loss', 'קו מסירה',      'סגירת קו מסירה אחרי איבוד',       9),
  ('attack_to_defense', 'slow_opponent_transition',      'האטה',          'האטת התקפת מעבר של היריב',        10),
  ('defense_to_attack', 'first_action_after_recovery',   'פעולה ראשונה', 'פעולה ראשונה אחרי חילוץ',       1),
  ('defense_to_attack', 'forward_pass_after_recovery',   'מסירה קדימה',  'מסירה קדימה אחרי חילוץ',        2),
  ('defense_to_attack', 'carry_after_recovery',          'הובלה',        'הובלת כדור אחרי חילוץ',         3),
  ('defense_to_attack', 'switch_after_recovery',         'שינוי צד',     'שינוי צד אחרי חילוץ',           4),
  ('defense_to_attack', 'quick_break_forward',           'יציאה מהירה',  'יציאה מהירה קדימה',             5),
  ('defense_to_attack', 'run_in_behind_after_recovery',  'לעומק',        'תנועה לעומק אחרי חילוץ',        6),
  ('defense_to_attack', 'join_transition_attack',        'הצטרפות',      'הצטרפות להתקפת מעבר',           7),
  ('defense_to_attack', 'retain_after_recovery',         'שמירה',        'שמירה על הכדור אחרי חילוץ',     8),
  ('defense_to_attack', 'first_decision_after_recovery', 'החלטה',        'קבלת החלטה ראשונה אחרי חילוץ',  9)
) AS v(category_key, key, code, label_he, sort_order)
JOIN public.taxonomy_categories c ON c.key = v.category_key
JOIN public.taxonomy_phases p ON p.id = c.phase_id AND p.sport = 'football'
ON CONFLICT (category_id, key) DO UPDATE
  SET code = EXCLUDED.code,
      label_he = EXCLUDED.label_he,
      sort_order = EXCLUDED.sort_order,
      active = true;

INSERT INTO public.taxonomy_zones (sport, key, label_he, sort_order) VALUES
  ('football', 'zone_1', 'זון 1', 1),
  ('football', 'zone_2', 'זון 2', 2),
  ('football', 'zone_3', 'זון 3', 3)
ON CONFLICT (sport, key) DO UPDATE
  SET label_he = EXCLUDED.label_he, sort_order = EXCLUDED.sort_order;

INSERT INTO public.taxonomy_fields (sport, key, label_he, target_category_id, sort_order)
SELECT 'football', 'pass_target', 'יעד מסירה', c.id, 1
FROM public.taxonomy_categories c
JOIN public.taxonomy_phases p ON p.id = c.phase_id AND p.sport = 'football'
WHERE c.key = 'pass'
ON CONFLICT (sport, key) DO UPDATE
  SET label_he = EXCLUDED.label_he,
      target_category_id = EXCLUDED.target_category_id,
      target_tag_id = NULL;

INSERT INTO public.taxonomy_fields (sport, key, label_he, target_tag_id, sort_order)
SELECT 'football', 'one_v_one_zone', 'אזור 1 על 1', t.id, 2
FROM public.taxonomy_tags t
JOIN public.taxonomy_categories c ON c.id = t.category_id
JOIN public.taxonomy_phases p ON p.id = c.phase_id AND p.sport = 'football'
WHERE t.key = 'one_v_one_defending'
ON CONFLICT (sport, key) DO UPDATE
  SET label_he = EXCLUDED.label_he,
      target_tag_id = EXCLUDED.target_tag_id,
      target_category_id = NULL;

INSERT INTO public.taxonomy_field_options (field_id, value, label_he, sort_order)
SELECT f.id, v.value, v.label_he, v.sort_order
FROM (VALUES
  ('pass_target',    'to_feet',  'לרגל', 1),
  ('pass_target',    'to_space', 'לשטח', 2),
  ('one_v_one_zone', 'wide',     'צד',   1),
  ('one_v_one_zone', 'central',  'אמצע', 2)
) AS v(field_key, value, label_he, sort_order)
JOIN public.taxonomy_fields f ON f.key = v.field_key AND f.sport = 'football'
ON CONFLICT (field_id, value) DO UPDATE
  SET label_he = EXCLUDED.label_he, sort_order = EXCLUDED.sort_order;

INSERT INTO public.taxonomy_outcomes (sport, set_key, value, label_he, polarity, sort_order) VALUES
  ('football', 'general',   'successful',      'מוצלח',            1,  1),
  ('football', 'general',   'unsuccessful',    'לא מוצלח',        -1,  2),
  ('football', 'general',   'neutral',         'ניטרלי',           0,  3),
  ('football', 'attacking', 'chance_created',  'יצירת מצב',        1,  1),
  ('football', 'attacking', 'keep',            'פעולה לשימור',     1,  2),
  ('football', 'attacking', 'improve',         'פעולה לשיפור',    -1,  3),
  ('football', 'attacking', 'turnover',        'איבוד כדור',      -1,  4),
  ('football', 'defensive', 'ball_recovery',   'חילוץ כדור',       1,  1),
  ('football', 'defensive', 'chance_prevented','מניעת מצב',        1,  2),
  ('football', 'defensive', 'keep',            'פעולה לשימור',     1,  3),
  ('football', 'defensive', 'improve',         'פעולה לשיפור',    -1,  4),
  ('football', 'defensive', 'foul',            'עבירה',           -1,  5),
  ('football', 'shot',      'goal',            'שער',              1,  1),
  ('football', 'shot',      'on_target',       'למסגרת',           1,  2),
  ('football', 'shot',      'blocked',         'נחסם',             0,  3),
  ('football', 'shot',      'off_target',      'מחוץ למסגרת',     -1,  4)
ON CONFLICT (sport, set_key, value) DO UPDATE
  SET label_he = EXCLUDED.label_he,
      polarity = EXCLUDED.polarity,
      sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- 5. BASKETBALL SEED (inert)
-- =============================================================================
INSERT INTO public.taxonomy_phases (sport, key, label_he, color_token, sort_order) VALUES
  ('basketball', 'offense', 'התקפה', 'amber', 1),
  ('basketball', 'general', 'כללי',  'slate', 2),
  ('basketball', 'defense', 'הגנה',  'sky',   3)
ON CONFLICT (sport, key) DO UPDATE
  SET label_he = EXCLUDED.label_he,
      color_token = EXCLUDED.color_token,
      sort_order = EXCLUDED.sort_order;

INSERT INTO public.taxonomy_categories (phase_id, key, label_he, state, outcome_set_key, sort_order)
SELECT p.id, v.key, v.label_he, NULL, 'general', v.sort_order
FROM (VALUES
  ('offense', 'offense', 'התקפה', 1),
  ('general', 'general', 'כללי',  1),
  ('defense', 'defense', 'הגנה',  1)
) AS v(phase_key, key, label_he, sort_order)
JOIN public.taxonomy_phases p ON p.key = v.phase_key AND p.sport = 'basketball'
ON CONFLICT (phase_id, key) DO UPDATE
  SET label_he = EXCLUDED.label_he, sort_order = EXCLUDED.sort_order, active = true;

INSERT INTO public.taxonomy_tags (category_id, key, code, label_he, description_he, default_score, sort_order)
SELECT c.id, v.key, v.code, v.label_he, v.description_he, 1, v.sort_order
FROM (VALUES
  ('offense', 'relocation',        'R',    'רילוקיישן',           'רילוקיישן — קרה/לא, איטי/מהיר',                                      1),
  ('offense', 'pick_and_roll',     'P&R',  'פיק אנד רול',         'פיק אנד רול — זוויות כניסה ויציאה, הדבקה, ריווח, קבלת החלטות',      2),
  ('offense', 'decision_drive',    'GDP',  'החלטות בחדירה',       'קבלת החלטות בחדירה',                                                 3),
  ('offense', 'shot_selection',    'GDS',  'בחירת זריקות',        'קליעה — בחירת זריקות וכניסה לקליעה',                                 4),
  ('offense', 'offensive_rebound', 'OR',   'אופנס ריבאונד',       'הליכה לאופנס ריבאונד',                                               5),
  ('offense', 'pass',              'PASS', 'מסירה',               'מסירה — בזמן, מחוץ לגוף',                                            6),
  ('offense', 'decision_catch',    'GDC',  'החלטות מתפיסה',       'קבלת החלטות מתפיסה — להחליט לפני התפיסה ולבצע בחצי שניה',            7),
  ('offense', 'ball_handling',     'BL',   'הובלת כדור',          'הובלת כדור — ראש מורם, כדרור רחוק, לא פספוס מסירות, הגעה למיקומים',  8),
  ('offense', 'basket_threat',     'BT',   'איום לסל',            'איום לסל — איום בכל חדירה, אף פעם לא לרוחב',                         9),
  ('general', 'body_language',     'BD',   'שפת גוף',             'שפת גוף',                                                            1),
  ('general', 'sprint_intensity',  'I',    'אינטנסיביות',         '100% בספרינט להגנה / לעמדה ההתקפית',                                 2),
  ('defense', 'on_ball_pressure',  'AG',   'אגרסיביות',           'אגרסיביות וקרבה לשחקן בהגנה האישית',                                 1),
  ('defense', 'box_out',           'CR',   'סגירה לריבאונד',      'סגירה לריבאונד',                                                     2),
  ('defense', 'off_ball_defense',  'OBD',  'הגנה רחוק מהכדור',    'מיקומים בהגנה רחוק מהכדור',                                          3),
  ('defense', 'passing_lane',      'DL',   'קו מסירה',            'עמידה על קו המסירה — תמיד בין לבין',                                 4),
  ('defense', 'defensive_stance',  'DP',   'עמידה הגנתית',        'כל הזמן נמוך עם הרגליים בעמדה הגנתית',                               5)
) AS v(category_key, key, code, label_he, description_he, sort_order)
JOIN public.taxonomy_categories c ON c.key = v.category_key
JOIN public.taxonomy_phases p ON p.id = c.phase_id AND p.sport = 'basketball'
ON CONFLICT (category_id, key) DO UPDATE
  SET code = EXCLUDED.code,
      label_he = EXCLUDED.label_he,
      description_he = EXCLUDED.description_he,
      sort_order = EXCLUDED.sort_order,
      active = true;

INSERT INTO public.taxonomy_outcomes (sport, set_key, value, label_he, polarity, sort_order) VALUES
  ('basketball', 'general', 'successful',   'טוב',      1, 1),
  ('basketball', 'general', 'neutral',      'ניטרלי',   0, 2),
  ('basketball', 'general', 'unsuccessful', 'רע',      -1, 3)
ON CONFLICT (sport, set_key, value) DO UPDATE
  SET label_he = EXCLUDED.label_he,
      polarity = EXCLUDED.polarity,
      sort_order = EXCLUDED.sort_order;
