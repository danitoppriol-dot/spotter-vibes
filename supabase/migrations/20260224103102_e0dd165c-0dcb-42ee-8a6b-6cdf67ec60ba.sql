
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  university TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, university)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    split_part(NEW.email, '@', 2)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Places table
CREATE TABLE public.places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('study', 'nightlife', 'cafe', 'cowork', 'outdoor')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_visible BOOLEAN NOT NULL DEFAULT false,
  opening_hours TEXT,
  google_maps_url TEXT,
  recommendation_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible places" ON public.places FOR SELECT USING (is_visible = true OR created_by = auth.uid());
CREATE POLICY "Authenticated users can insert places" ON public.places FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update their places" ON public.places FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Owners can delete their places" ON public.places FOR DELETE USING (auth.uid() = created_by);

-- Recommendations table (unique per user+place)
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, place_id)
);
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations" ON public.recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert recommendations" ON public.recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own recommendations" ON public.recommendations FOR DELETE USING (auth.uid() = user_id);

-- Auto-update place visibility on recommendation insert
CREATE OR REPLACE FUNCTION public.update_place_visibility()
RETURNS TRIGGER AS $$
DECLARE
  rec_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO rec_count
  FROM public.recommendations
  WHERE place_id = COALESCE(NEW.place_id, OLD.place_id);

  UPDATE public.places
  SET recommendation_count = rec_count,
      is_visible = (rec_count >= 5)
  WHERE id = COALESCE(NEW.place_id, OLD.place_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_recommendation_change
  AFTER INSERT OR DELETE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_place_visibility();

-- Auto-add first recommendation when place is created
CREATE OR REPLACE FUNCTION public.auto_recommend_on_place_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.recommendations (user_id, place_id)
  VALUES (NEW.created_by, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_place_created
  AFTER INSERT ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.auto_recommend_on_place_create();

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews of visible places" ON public.reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.places WHERE id = place_id AND is_visible = true)
    OR auth.uid() = user_id
  );
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.places WHERE id = place_id AND is_visible = true)
  );
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
