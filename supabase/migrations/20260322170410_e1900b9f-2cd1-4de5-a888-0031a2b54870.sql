
-- Workout plans table for coach editing
CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_index integer NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  month_label text NOT NULL DEFAULT '',
  year integer NOT NULL DEFAULT 2026,
  month integer NOT NULL DEFAULT 1,
  emoji text NOT NULL DEFAULT '🏀',
  image_url text,
  shooting_image_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view
CREATE POLICY "Anyone can view workout plans"
ON public.workout_plans FOR SELECT
TO authenticated
USING (true);

-- Coaches can manage
CREATE POLICY "Coaches can manage workout plans"
ON public.workout_plans FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'coach'::app_role))
WITH CHECK (has_role(auth.uid(), 'coach'::app_role));

-- Seed with defaults
INSERT INTO public.workout_plans (month_index, title, subtitle, month_label, year, month, emoji) VALUES
(1, 'עקיפה + קליעה', 'שליטה בכדור וטכניקת קליעה', 'אפריל', 2026, 4, '🏀'),
(2, 'תוכנית קליעה', 'טכניקת קליעה בסיסית', 'מאי', 2026, 5, '🎯'),
(3, 'תוכנית קליעה', 'מכני קליעה ומכדור', 'יוני', 2026, 6, '📏'),
(4, 'עקיפה + קליעה', 'שליטה מתקדמת וקליעה מכדרור', 'יולי', 2026, 7, '⚡'),
(5, 'תוכנית קליעה', 'תוכנית קליעה מספר 3', 'אוגוסט', 2026, 8, '🔥'),
(6, 'שליטה + קליעה', 'שליטה בכדור וקליעה מהירה', 'ספטמבר', 2026, 9, '🤲'),
(7, 'עבודה + קליעה', 'תרגול מקיף וקליעה', 'אוקטובר', 2026, 10, '💪'),
(8, 'עקיפה + קליעה', 'אימון אישי משולב', 'נובמבר', 2026, 11, '🏃'),
(9, 'תוכנית קליעה', 'מתאמנים אישיים', 'דצמבר', 2026, 12, '🎯'),
(10, 'תוכנית קליעה', 'מתאמנים אישיים - מתקדם', 'ינואר', 2027, 1, '⭐'),
(11, 'שליטה + קליעה', 'שליטה בכדור וקליעה מעמידה', 'פברואר', 2027, 2, '🏀'),
(12, 'תוכנית קליעה', 'אימונים אישיים', 'מרץ', 2027, 3, '🎯'),
(13, 'עקיפה + קליעה', 'שלב מתקדם משולב', 'אפריל', 2027, 4, '⚡'),
(14, 'תוכנית קליעה', 'שלב מתקדם', 'מאי', 2027, 5, '🔥'),
(15, 'כוח + קליעה', 'מהירות וקליעה תחת לחץ', 'יוני', 2027, 6, '💪'),
(16, 'תוכנית קליעה', 'מתקדמים', 'יולי', 2027, 7, '🎯'),
(17, 'עקיפה + קליעה', 'רמה גבוהה משולב', 'אוגוסט', 2027, 8, '⚡'),
(18, 'תוכנית קליעה', 'קליעה בתנועה', 'ספטמבר', 2027, 9, '🏃'),
(19, 'עקיפה + קליעה', 'מגע, תנועה וקליעה', 'אוקטובר', 2027, 10, '🤲'),
(20, 'תוכנית קליעה', 'Shooting in Motion', 'נובמבר', 2027, 11, '🎯'),
(21, 'תוכנית קליעה', 'Catch and Shoot', 'דצמבר', 2027, 12, '🔥'),
(22, 'תוכנית קליעה', 'מתאמנים אישיים - Pro', 'ינואר', 2028, 1, '⭐'),
(23, 'עקיפה + קליעה', 'מתקדמים Pro משולב', 'פברואר', 2028, 2, '⚡'),
(24, 'תוכנית קליעה', 'Elite', 'מרץ', 2028, 3, '🏆'),
(25, 'תוכנית משולבת', 'Elite - עקיפה וקליעה', 'אפריל', 2028, 4, '🏆'),
(26, 'כוח + קליעה', 'Elite - כוח וקליעה', 'מאי', 2028, 5, '💪'),
(27, 'תוכנית סיום', 'סיכום כולל - שליטה וקליעה', 'יוני', 2028, 6, '🏅');

-- Allow players to insert their own sessions (for self-coaching)
CREATE POLICY "Players can insert own sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (player_id = auth.uid());
