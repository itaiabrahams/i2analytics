
-- Update the handle_new_user trigger to set is_approved
-- First coach is auto-approved, all others need approval
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
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'player');
  
  -- Check if this is the first coach (auto-approve)
  SELECT COUNT(*) INTO _coach_count FROM public.profiles WHERE role = 'coach';
  
  IF _role = 'coach' AND _coach_count = 0 THEN
    _approved := true;
  ELSE
    _approved := false;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    _role,
    _approved
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$function$;
