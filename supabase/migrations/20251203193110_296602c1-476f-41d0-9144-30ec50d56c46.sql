-- Add image_url column to locations table for location images
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.locations.image_url IS 'URL of the location image stored in maps bucket';