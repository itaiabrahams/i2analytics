ALTER TABLE public.profiles ADD COLUMN age_category text DEFAULT NULL;

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
  _tier subscription_tier;
  _payment text;
  _phone text;
  _team text;
  _age integer;
  _age_category text;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'player');
  _coach_id := (NEW.raw_user_meta_data->>'coach_id')::uuid;
  _phone := NEW.raw_user_meta_data->>'phone_number';
  _team := NEW.raw_user_meta_data->>'team';
  _age := (NEW.raw_user_meta_data->>'age')::integer;
  _age_category := NEW.raw_user_meta_data->>'age_category';
  
  SELECT COUNT(*) INTO _coach_count FROM public.profiles WHERE role = 'coach';
  
  IF _role = 'coach' THEN
    _tier := 'free';
    _payment := 'active';
    IF _coach_count = 0 THEN
      _approved := true;
    ELSE
      _approved := false;
    END IF;
  ELSE
    _tier := COALESCE((NEW.raw_user_meta_data->>'subscription_tier')::subscription_tier, 'basic');
    _payment := 'pending';
    _approved := false;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, role, is_approved, coach_id, subscription_tier, payment_status, phone_number, team, age, age_category)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    _role,
    _approved,
    _coach_id,
    _tier,
    _payment,
    _phone,
    _team,
    _age,
    _age_category
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$function$;