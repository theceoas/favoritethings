-- Setup Brand Images Storage
-- Create storage bucket for brand preview images

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-images',
  'brand-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the brand-images bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'brand-images');

CREATE POLICY "Authenticated users can upload brand images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'brand-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update brand images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'brand-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete brand images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'brand-images' 
  AND auth.role() = 'authenticated'
);

-- Verify the setup
SELECT 
  'Storage bucket created:' as info,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'brand-images'; 