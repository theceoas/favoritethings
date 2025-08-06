-- Add missing columns to products table for Bedz & Buttunz

-- Add category column
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

-- Add tags column (JSONB for better querying)
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- Add handle column for SEO-friendly URLs
ALTER TABLE products ADD COLUMN IF NOT EXISTS handle TEXT;

-- Add weight column for shipping calculations
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2);

-- Add compare_at_price column for sale pricing
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2);

-- Add inventory_quantity column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_quantity INTEGER DEFAULT 0;

-- Add low_stock_threshold column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Add status column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add images column as JSONB array if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Create unique index on handle for SEO URLs
CREATE UNIQUE INDEX IF NOT EXISTS products_handle_idx ON products(handle) WHERE handle IS NOT NULL;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);

-- Create index on status for active product queries
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);

-- Create GIN index on tags for better JSONB querying
CREATE INDEX IF NOT EXISTS products_tags_gin_idx ON products USING GIN(tags);

-- Update any existing products to have active status
UPDATE products SET status = 'active' WHERE status IS NULL; 