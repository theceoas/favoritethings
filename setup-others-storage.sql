-- Setup script for Supabase Storage - Others Items
-- Run this in your Supabase SQL editor to create storage bucket and policies for others items

-- Create the others-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('others-images', 'others-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for admin users to upload others images
CREATE POLICY "Admins can upload others images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'others-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create policy for public read access to others images
CREATE POLICY "Public can view others images" ON storage.objects
FOR SELECT USING (bucket_id = 'others-images');

-- Create policy for admin users to update others images
CREATE POLICY "Admins can update others images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'others-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create policy for admin users to delete others images
CREATE POLICY "Admins can delete others images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'others-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a function to generate unique file names for others images
CREATE OR REPLACE FUNCTION generate_others_image_name()
RETURNS TEXT AS $$
BEGIN
  RETURN 'others/' || gen_random_uuid()::text || '.jpg';
END;
$$ LANGUAGE plpgsql; 