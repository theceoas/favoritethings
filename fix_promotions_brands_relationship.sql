-- Drop existing foreign key if it exists
ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_brand_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE promotions ADD CONSTRAINT promotions_brand_id_fkey 
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_brand_id ON promotions(brand_id); 