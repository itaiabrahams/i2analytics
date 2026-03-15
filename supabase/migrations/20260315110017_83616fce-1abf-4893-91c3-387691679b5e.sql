
CREATE OR REPLACE FUNCTION public.is_head_coach(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND email IN ('itaiabrahams@gmail.com', 'idan.dank@gmail.com')
  )
$function$;
