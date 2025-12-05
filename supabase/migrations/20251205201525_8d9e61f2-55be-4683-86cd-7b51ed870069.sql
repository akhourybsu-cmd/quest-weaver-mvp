-- Drop the existing permissive INSERT policy for portraits
DROP POLICY IF EXISTS "Authenticated users can upload to portraits" ON storage.objects;

-- Create proper INSERT policy that requires uploading to user's own folder
CREATE POLICY "Authenticated users can upload to portraits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portraits' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);