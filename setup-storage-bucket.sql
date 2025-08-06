-- Enable storage if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom-orders bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-orders',
  'custom-orders',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Allow public access to the custom-orders bucket
CREATE POLICY "Custom Orders Public Access" 
ON storage.objects FOR SELECT
USING (bucket_id = 'custom-orders');

-- Allow authenticated users to upload to custom-orders
CREATE POLICY "Custom Orders User Upload" 
ON storage.objects
FOR INSERT
WITH CHECK ( 
    bucket_id = 'custom-orders' 
    AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads in custom-orders
CREATE POLICY "Custom Orders User Update" 
ON storage.objects
FOR UPDATE
USING (bucket_id = 'custom-orders' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'custom-orders' AND auth.uid() = owner);

-- Allow users to delete their own uploads from custom-orders
CREATE POLICY "Custom Orders User Delete" 
ON storage.objects
FOR DELETE
USING (bucket_id = 'custom-orders' AND auth.uid() = owner); 