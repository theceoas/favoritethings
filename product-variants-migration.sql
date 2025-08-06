-- Database migration to fix product variants schema issues
-- This adds missing fields that the application code expects

-- Add missing columns to product_variants table
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS featured_image TEXT;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT false;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS pattern VARCHAR(50);

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS thread_count VARCHAR(20);

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS variant_data JSONB DEFAULT '{}';

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Update existing records to set track_inventory to true where it's null
UPDATE product_variants SET track_inventory = true WHERE track_inventory IS NULL;

-- Create indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_product_variants_track_inventory ON product_variants(track_inventory);
CREATE INDEX IF NOT EXISTS idx_product_variants_sort_order ON product_variants(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_default ON product_variants(is_default);

-- Handle dimensions column conversion safely
DO $$ 
BEGIN
  -- Check if dimensions column exists and its current type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' 
    AND column_name = 'dimensions'
  ) THEN
    
    -- Check if it's already JSONB
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'product_variants' 
      AND column_name = 'dimensions' 
      AND data_type = 'jsonb'
    ) THEN
      RAISE NOTICE 'Dimensions column is already JSONB type - skipping conversion';
    ELSE
      -- It's TEXT/VARCHAR, convert to JSONB
      RAISE NOTICE 'Converting dimensions column from text to JSONB';
      
      -- First, create a temporary column
      ALTER TABLE product_variants ADD COLUMN dimensions_temp JSONB;
      
      -- Convert valid JSON data, set invalid data to NULL
      UPDATE product_variants 
      SET dimensions_temp = CASE 
        WHEN dimensions IS NULL THEN NULL
        WHEN dimensions = '' THEN NULL
        WHEN dimensions = 'null' THEN NULL
        WHEN dimensions ~ '^[\s]*[{\[].*[}\]][\s]*$' THEN dimensions::jsonb
        ELSE NULL
      END;
      
      -- Drop old column and rename new one
      ALTER TABLE product_variants DROP COLUMN dimensions;
      ALTER TABLE product_variants RENAME COLUMN dimensions_temp TO dimensions;
    END IF;
  ELSE
    -- Column doesn't exist, create it as JSONB
    ALTER TABLE product_variants ADD COLUMN dimensions JSONB;
    RAISE NOTICE 'Created new dimensions column as JSONB';
  END IF;
END $$;

-- Copy image_url to featured_image for existing records (only if image_url column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' 
    AND column_name = 'image_url'
  ) THEN
    UPDATE product_variants 
    SET featured_image = image_url 
    WHERE featured_image IS NULL AND image_url IS NOT NULL;
    RAISE NOTICE 'Copied image_url values to featured_image';
  ELSE
    RAISE NOTICE 'image_url column does not exist - skipping copy operation';
  END IF;
END $$;

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Product variants schema migration completed successfully';
  RAISE NOTICE 'Added columns: track_inventory, featured_image, images, allow_backorder, low_stock_threshold, pattern, thread_count, variant_data, sort_order, is_default';
  RAISE NOTICE 'Handled dimensions column conversion safely';
  RAISE NOTICE 'Migration completed without errors';
END $$; 