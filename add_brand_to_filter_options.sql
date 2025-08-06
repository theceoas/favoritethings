-- Add brand_id column to filter_options table
ALTER TABLE filter_options 
ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_filter_options_brand_id ON filter_options(brand_id);

-- Update RLS policies to include brand_id
DROP POLICY IF EXISTS "Allow public read access to filter_options" ON filter_options;
CREATE POLICY "Allow public read access to filter_options" ON filter_options
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert filter_options" ON filter_options;
CREATE POLICY "Allow authenticated users to insert filter_options" ON filter_options
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update filter_options" ON filter_options;
CREATE POLICY "Allow authenticated users to update filter_options" ON filter_options
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete filter_options" ON filter_options;
CREATE POLICY "Allow authenticated users to delete filter_options" ON filter_options
    FOR DELETE USING (auth.role() = 'authenticated'); 