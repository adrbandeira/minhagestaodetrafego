CREATE OR REPLACE FUNCTION public.can_bootstrap_signup()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles)
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role);
$$;