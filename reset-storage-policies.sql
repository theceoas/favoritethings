-- Drop existing policies
DROP POLICY IF EXISTS "Custom Orders Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Custom Orders User Upload" ON storage.objects;
DROP POLICY IF EXISTS "Custom Orders User Update" ON storage.objects;
DROP POLICY IF EXISTS "Custom Orders User Delete" ON storage.objects;

-- Recreate policies
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