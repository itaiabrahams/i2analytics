
-- Add coach_id to profiles (which coach this player belongs to)
ALTER TABLE public.profiles ADD COLUMN coach_id uuid;

-- Add is_demo flag to profiles
ALTER TABLE public.profiles ADD COLUMN is_demo boolean NOT NULL DEFAULT false;

-- Update handle_new_user to store coach_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
  _approved boolean;
  _coach_count integer;
  _coach_id uuid;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'player');
  _coach_id := (NEW.raw_user_meta_data->>'coach_id')::uuid;
  
  -- Check if this is the first coach (auto-approve)
  SELECT COUNT(*) INTO _coach_count FROM public.profiles WHERE role = 'coach';
  
  IF _role = 'coach' AND _coach_count = 0 THEN
    _approved := true;
  ELSE
    _approved := false;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, role, is_approved, coach_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    _role,
    _approved,
    _coach_id
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$function$;
