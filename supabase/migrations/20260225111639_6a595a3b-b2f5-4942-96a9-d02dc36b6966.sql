
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. RLS policies for user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 6. Update places RLS to allow moderators to manage places
CREATE POLICY "Moderators can update any place" ON public.places
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can delete any place" ON public.places
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

-- 7. Allow moderators to view ALL places (including non-visible)
CREATE POLICY "Moderators can view all places" ON public.places
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

-- 8. Update visibility trigger: show places with 1+ recommendations
CREATE OR REPLACE FUNCTION public.update_place_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  rec_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO rec_count
  FROM public.recommendations
  WHERE place_id = COALESCE(NEW.place_id, OLD.place_id);

  UPDATE public.places
  SET recommendation_count = rec_count,
      is_visible = (rec_count >= 1)
  WHERE id = COALESCE(NEW.place_id, OLD.place_id);

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 9. Allow moderators/admins to also insert reviews on any place
CREATE POLICY "Moderators can insert reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin')));
