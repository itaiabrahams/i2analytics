-- 1. Add approval status to challenge_entries
ALTER TABLE public.challenge_entries ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Update existing entries to approved (they were already submitted before this feature)
UPDATE public.challenge_entries SET status = 'approved' WHERE status = 'pending';

-- 2. Trigger to notify coaches when a player creates a shot_session
CREATE OR REPLACE FUNCTION public.notify_coaches_on_shot_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  player_name text;
  coach_record record;
BEGIN
  -- Get player name
  SELECT display_name INTO player_name
  FROM public.profiles
  WHERE user_id = NEW.player_id
  LIMIT 1;

  -- Notify all approved coaches
  FOR coach_record IN
    SELECT user_id FROM public.profiles
    WHERE role = 'coach' AND is_approved = true
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      coach_record.user_id,
      'אימון חדש הועלה 🏀',
      COALESCE(player_name, 'שחקן') || ' העלה אימון חדש: ' || COALESCE(NEW.title, 'אימון קליעות'),
      'training',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_shot_session_created
AFTER INSERT ON public.shot_sessions
FOR EACH ROW
EXECUTE FUNCTION public.notify_coaches_on_shot_session();