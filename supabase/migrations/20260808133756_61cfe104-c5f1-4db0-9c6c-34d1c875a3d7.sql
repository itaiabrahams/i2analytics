REVOKE ALL ON FUNCTION public.enable_player_football(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enable_player_football(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.enable_player_football(uuid) TO authenticated;