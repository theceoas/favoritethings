-- Add brand_id column to filter_categories table
ALTER TABLE filter_categories 
ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_filter_categories_brand_id ON filter_categories(brand_id);

-- Update RLS policies to include brand_id
DROP POLICY IF EXISTS "Allow public read access to filter_categories" ON filter_categories;
CREATE POLICY "Allow public read access to filter_categories" ON filter_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert filter_categories" ON filter_categories;
CREATE POLICY "Allow authenticated users to insert filter_categories" ON filter_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update filter_categories" ON filter_categories;
CREATE POLICY "Allow authenticated users to update filter_categories" ON filter_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete filter_categories" ON filter_categories;
CREATE POLICY "Allow authenticated users to delete filter_categories" ON filter_categories
    FOR DELETE USING (auth.role() = 'authenticated'); 