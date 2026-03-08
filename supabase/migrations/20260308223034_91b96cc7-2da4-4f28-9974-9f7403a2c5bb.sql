
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS sub_category text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS filters jsonb DEFAULT '{}';

-- Self-cleaning trigger: auto-hide places whose avg rating drops below 3.5
CREATE OR REPLACE FUNCTION public.auto_clean_low_rated_places()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  avg_rating NUMERIC;
  target_place_id UUID;
BEGIN
  target_place_id := COALESCE(NEW.place_id, OLD.place_id);
  
  SELECT AVG(rating)::NUMERIC INTO avg_rating
  FROM public.reviews
  WHERE place_id = target_place_id;
  
  IF avg_rating IS NOT NULL AND avg_rating < 3.5 THEN
    UPDATE public.places
    SET is_visible = false
    WHERE id = target_place_id AND is_visible = true;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_review_check_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_clean_low_rated_places();
