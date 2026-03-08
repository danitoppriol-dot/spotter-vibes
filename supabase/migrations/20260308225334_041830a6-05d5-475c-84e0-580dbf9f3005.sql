
-- Map ratings table for rating other users' public maps
CREATE TABLE public.map_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_user_id UUID NOT NULL,
  profile_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rater_user_id, profile_user_id)
);

ALTER TABLE public.map_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view map ratings"
ON public.map_ratings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert map ratings"
ON public.map_ratings FOR INSERT
WITH CHECK (auth.uid() = rater_user_id);

CREATE POLICY "Users can update own ratings"
ON public.map_ratings FOR UPDATE
USING (auth.uid() = rater_user_id);

CREATE POLICY "Users can delete own ratings"
ON public.map_ratings FOR DELETE
USING (auth.uid() = rater_user_id);

-- Add expires_at to places for temporary pins
ALTER TABLE public.places ADD COLUMN expires_at TIMESTAMPTZ DEFAULT NULL;
