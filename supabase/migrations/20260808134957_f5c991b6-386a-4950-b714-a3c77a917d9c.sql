DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'taxonomy_phases','taxonomy_categories','taxonomy_tags',
    'taxonomy_fields','taxonomy_field_options','taxonomy_outcomes','taxonomy_zones'
  ] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;