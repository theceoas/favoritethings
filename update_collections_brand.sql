-- Update Collections to include brand_id
-- Run this in your Supabase SQL Editor

-- 1. Add brand_id column to collections table
ALTER TABLE collections ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- 2. Update existing collections with brand_id based on their slug
UPDATE collections 
SET brand_id = (
  SELECT id FROM brands 
  WHERE slug = CASE 
    WHEN collections.slug LIKE 'kiowa-%' THEN 'kiowa'
    WHEN collections.slug LIKE 'omogebyify-%' THEN 'omogebyify'
    WHEN collections.slug LIKE 'minime-%' THEN 'minime'
    ELSE 'kiowa' -- default
  END
)
WHERE brand_id IS NULL;

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_collections_brand_id ON collections(brand_id);

-- 4. Update RLS policies to include brand_id
DROP POLICY IF EXISTS "Allow public read access to collections" ON collections;
CREATE POLICY "Allow public read access to collections" ON collections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage collections" ON collections;
CREATE POLICY "Allow authenticated users to manage collections" ON collections
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Verify the updates
SELECT 
    c.name,
    c.slug,
    c.brand_id,
    b.name as brand_name,
    b.slug as brand_slug
FROM collections c
LEFT JOIN brands b ON c.brand_id = b.id
ORDER BY c.sort_order; 