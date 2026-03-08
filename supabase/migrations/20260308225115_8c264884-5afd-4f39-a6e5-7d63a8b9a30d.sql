
ALTER TABLE public.profiles ADD COLUMN share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Update existing rows to have a share token
UPDATE public.profiles SET share_token = encode(gen_random_bytes(16), 'hex') WHERE share_token IS NULL;

-- Allow anyone to view a profile by share_token (for shared links)
CREATE POLICY "Anyone can view profiles by share_token"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive select policy since the new one covers it
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
