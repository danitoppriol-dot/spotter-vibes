
-- Add Phase B columns to places
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS map_type text NOT NULL DEFAULT 'both';
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS questionnaire jsonb DEFAULT '{}';

-- Create storage bucket for place photos
INSERT INTO storage.buckets (id, name, public) VALUES ('place-photos', 'place-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to place-photos
CREATE POLICY "Authenticated users can upload place photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'place-photos');

-- Allow public read access to place photos
CREATE POLICY "Public read access to place photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'place-photos');
