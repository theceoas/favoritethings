-- Add barcode column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Add barcode column to product_variants table  
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Add indexes for faster searching by barcode
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN products.barcode IS 'Store product code/barcode for physical store operations';
COMMENT ON COLUMN product_variants.barcode IS 'Store product code/barcode for specific variant in physical store operations'; 