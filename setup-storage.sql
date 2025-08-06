-- Setup script for Supabase Storage
-- Run this in your Supabase SQL editor to create storage buckets and policies

-- Create the images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Create policy for public read access to images
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Create policy for authenticated users to update their uploads
CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Create policy for authenticated users to delete images
CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
); 