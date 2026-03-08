
-- Add is_blocked to profiles
ALTER TABLE public.profiles ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT false;

-- Security definer function to find user by email (only callable by admins)
CREATE OR REPLACE FUNCTION public.find_user_by_email(_email text)
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id as user_id, au.email::text as email
  FROM auth.users au
  WHERE au.email = _email
  LIMIT 1;
$$;

-- Security definer function to list all users (only for admin dashboard)
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id as user_id, au.email::text as email, au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
$$;

-- Assign admin role to priola@kth.se if they exist
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role
FROM auth.users au
WHERE au.email = 'priola@kth.se'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also assign admin to danipriols@gmail.com (existing admin)
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role
FROM auth.users au
WHERE au.email = 'danipriols@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
