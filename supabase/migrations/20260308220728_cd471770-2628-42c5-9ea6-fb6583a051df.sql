
-- Add profile settings columns first
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_map_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_name_public boolean NOT NULL DEFAULT false;

-- Saved/favorite places table
CREATE TABLE IF NOT EXISTS public.saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, place_id)
);

ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved places"
  ON public.saved_places FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved places"
  ON public.saved_places FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved places"
  ON public.saved_places FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view saved places of public profiles"
  ON public.saved_places FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = saved_places.user_id
        AND profiles.is_map_public = true
    )
  );
