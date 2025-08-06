-- Add barcode column to products table (if not already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'barcode') THEN
        ALTER TABLE products ADD COLUMN barcode TEXT;
    END IF;
END $$;

-- Add barcode column to product_variants table (if not already exists)  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_variants' AND column_name = 'barcode') THEN
        ALTER TABLE product_variants ADD COLUMN barcode TEXT;
    END IF;
END $$;

-- Add indexes for faster searching by barcode
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;

-- Update RLS policies if needed (optional)
-- This ensures barcode field is accessible through your existing policies 