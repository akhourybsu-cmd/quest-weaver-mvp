-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own portraits" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own portraits" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own portraits" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view portraits" ON storage.objects;

-- Create more permissive policies for portraits bucket
-- Allow authenticated users to upload to their own user folder
CREATE POLICY "Authenticated users can upload portraits"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own portraits
CREATE POLICY "Authenticated users can update their portraits"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own portraits
CREATE POLICY "Authenticated users can delete their portraits"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all portraits
CREATE POLICY "Public can view all portraits"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'portraits');