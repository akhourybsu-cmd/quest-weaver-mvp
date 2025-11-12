-- Create portraits storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portraits', 'portraits', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own portraits
CREATE POLICY "Users can upload their own portraits"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portraits' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own portraits
CREATE POLICY "Users can update their own portraits"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portraits' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own portraits
CREATE POLICY "Users can delete their own portraits"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portraits' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to portraits
CREATE POLICY "Anyone can view portraits"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'portraits');