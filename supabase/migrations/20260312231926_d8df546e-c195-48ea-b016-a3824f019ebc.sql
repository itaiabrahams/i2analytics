
-- Function to create notification when a player challenge is created
CREATE OR REPLACE FUNCTION public.notify_on_challenge_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  challenger_name text;
BEGIN
  -- Get challenger display name
  SELECT display_name INTO challenger_name
  FROM public.profiles
  WHERE user_id = NEW.challenger_id
  LIMIT 1;

  -- Create notification for the challenged player
  INSERT INTO public.notifications (user_id, title, message, type, reference_id)
  VALUES (
    NEW.challenged_id,
    'אתגר חדש! ⚔️',
    COALESCE(challenger_name, 'שחקן') || ' שלח/ה לך אתגר: ' || COALESCE(NEW.description, 'אתגר קליעות'),
    'challenge',
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Trigger on player_challenges insert
CREATE TRIGGER on_challenge_created
AFTER INSERT ON public.player_challenges
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_challenge_created();

-- Also notify when challenge is accepted
CREATE OR REPLACE FUNCTION public.notify_on_challenge_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  accepter_name text;
BEGIN
  -- Only fire when status changes to 'active' from 'pending'
  IF OLD.status = 'pending' AND NEW.status = 'active' THEN
    SELECT display_name INTO accepter_name
    FROM public.profiles
    WHERE user_id = NEW.challenged_id
    LIMIT 1;

    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      NEW.challenger_id,
      'אתגר התקבל! ✅',
      COALESCE(accepter_name, 'שחקן') || ' קיבל/ה את האתגר שלך!',
      'challenge',
      NEW.id
    );
  END IF;

  -- Notify when challenge is completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.winner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      NEW.winner_id,
      'ניצחת באתגר! 🏆',
      'כל הכבוד! ניצחת באתגר הקליעות!',
      'challenge',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_challenge_updated
AFTER UPDATE ON public.player_challenges
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_challenge_accepted();
