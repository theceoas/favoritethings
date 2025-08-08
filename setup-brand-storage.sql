-- Setup script for Brand Images Storage
-- Run this in your Supabase SQL editor to ensure brand image storage works properly

-- Ensure the images bucket exists (this should already exist from setup-storage.sql)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Check if policies exist and create them if needed
-- Policy for authenticated users to upload to images bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'images' 
        AND operation = 'INSERT'
        AND name = 'Authenticated users can upload images'
    ) THEN
        CREATE POLICY "Authenticated users can upload images" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'images' 
            AND auth.role() = 'authenticated'
        );
    END IF;
END
$$;

-- Policy for public read access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'images' 
        AND operation = 'SELECT'
        AND name = 'Public can view images'
    ) THEN
        CREATE POLICY "Public can view images" ON storage.objects
        FOR SELECT USING (bucket_id = 'images');
    END IF;
END
$$;

-- Policy for authenticated users to update images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'images' 
        AND operation = 'UPDATE'
        AND name = 'Authenticated users can update images'
    ) THEN
        CREATE POLICY "Authenticated users can update images" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'images' 
            AND auth.role() = 'authenticated'
        );
    END IF;
END
$$;

-- Policy for authenticated users to delete images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.policies 
        WHERE bucket_id = 'images' 
        AND operation = 'DELETE'
        AND name = 'Authenticated users can delete images'
    ) THEN
        CREATE POLICY "Authenticated users can delete images" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'images' 
            AND auth.role() = 'authenticated'
        );
    END IF;
END
$$;

-- Grant necessary permissions for storage
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 