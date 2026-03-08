
-- Add study-specific columns to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS has_outlets boolean;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS silence_level integer;

-- Add constraint for silence_level range
ALTER TABLE public.reviews ADD CONSTRAINT silence_level_range CHECK (silence_level IS NULL OR (silence_level >= 1 AND silence_level <= 5));

-- Update the auto_clean trigger to use 4 reviewers OR avg >= 3.5 for visibility
CREATE OR REPLACE FUNCTION public.update_place_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec_count INTEGER;
  review_count INTEGER;
  avg_rating NUMERIC;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO rec_count
  FROM public.recommendations
  WHERE place_id = COALESCE(NEW.place_id, OLD.place_id);

  SELECT COUNT(*), COALESCE(AVG(rating), 0) INTO review_count, avg_rating
  FROM public.reviews
  WHERE place_id = COALESCE(NEW.place_id, OLD.place_id);

  -- Visible if has at least 1 recommendation
  -- Official (full opacity) if 4+ unique reviewers OR avg rating >= 3.5
  -- Auto-hide if avg rating < 3.5 AND has reviews
  UPDATE public.places
  SET recommendation_count = rec_count,
      is_visible = CASE
        WHEN review_count > 0 AND avg_rating < 3.5 THEN false
        WHEN rec_count >= 1 THEN true
        ELSE false
      END
  WHERE id = COALESCE(NEW.place_id, OLD.place_id);

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Also update auto_clean to incorporate the same logic on review insert/update/delete
CREATE OR REPLACE FUNCTION public.auto_clean_low_rated_places()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
  target_place_id UUID;
BEGIN
  target_place_id := COALESCE(NEW.place_id, OLD.place_id);
  
  SELECT COUNT(*), AVG(rating)::NUMERIC INTO review_count, avg_rating
  FROM public.reviews
  WHERE place_id = target_place_id;
  
  IF review_count > 0 AND avg_rating < 3.5 THEN
    UPDATE public.places
    SET is_visible = false
    WHERE id = target_place_id AND is_visible = true;
  ELSIF review_count >= 4 OR (avg_rating IS NOT NULL AND avg_rating >= 3.5) THEN
    UPDATE public.places
    SET is_visible = true
    WHERE id = target_place_id AND is_visible = false;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
