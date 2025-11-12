-- Temporarily make portraits bucket more permissive for debugging
-- Drop existing INSERT policy and create a simpler one
DROP POLICY IF EXISTS "Authenticated users can upload portraits" ON storage.objects;

-- Allow any authenticated user to upload to portraits bucket
CREATE POLICY "Authenticated users can upload to portraits"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portraits');