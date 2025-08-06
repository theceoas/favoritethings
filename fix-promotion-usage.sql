ennium -- Fix promotion usage tracking system

-- Create function to safely decrement promotion usage count
CREATE OR REPLACE FUNCTION decrement_promotion_usage(promotion_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE promotions
    SET times_used = GREATEST(0, times_used - 1)
    WHERE id = promotion_id;
END;
$$;

-- Create function to safely increment promotion usage count  
CREATE OR REPLACE FUNCTION increment_promotion_usage(promotion_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE promotions
    SET times_used = times_used + 1
    WHERE id = promotion_id;
END;
$$;

-- Apply the database constraints to prevent negative inventory
-- (Run these if they weren't applied before)

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add low_stock_threshold column to products table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
    ) THEN
        ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
    END IF;

    -- Add low_stock_threshold column to product_variants table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'low_stock_threshold'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
    END IF;
END $$;

-- Add check constraint to products table to prevent negative inventory
DO $$ 
BEGIN
    -- Only add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_inventory'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT check_positive_inventory 
        CHECK (inventory_quantity >= 0);
    END IF;
END $$;

-- Add check constraint to product_variants table to prevent negative inventory
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_variant_inventory'
    ) THEN
        ALTER TABLE product_variants 
        ADD CONSTRAINT check_positive_variant_inventory 
        CHECK (inventory_quantity >= 0);
    END IF;
END $$;

-- Add check constraint to prevent negative low_stock_threshold (only if column exists)
DO $$ 
BEGIN
    -- Check if low_stock_threshold column exists in products table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_low_stock_threshold'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT check_positive_low_stock_threshold 
        CHECK (low_stock_threshold >= 0);
    END IF;
END $$;

DO $$ 
BEGIN
    -- Check if low_stock_threshold column exists in product_variants table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'low_stock_threshold'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_variant_low_stock_threshold'
    ) THEN
        ALTER TABLE product_variants 
        ADD CONSTRAINT check_positive_variant_low_stock_threshold 
        CHECK (low_stock_threshold >= 0);
    END IF;
END $$;

-- Create indexes for better performance on inventory queries (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_products_inventory_tracking 
ON products(track_inventory, inventory_quantity) 
WHERE track_inventory = true;

CREATE INDEX IF NOT EXISTS idx_product_variants_inventory_tracking 
ON product_variants(track_inventory, inventory_quantity) 
WHERE track_inventory = true;

-- Create index for low stock alerts (if columns exist)
DO $$ 
BEGIN
    -- Create index for products low stock if low_stock_threshold column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_products_low_stock 
        ON products(inventory_quantity, low_stock_threshold) 
        WHERE track_inventory = true;
    END IF;

    -- Create index for product variants low stock if low_stock_threshold column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'low_stock_threshold'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_product_variants_low_stock 
        ON product_variants(inventory_quantity, low_stock_threshold) 
        WHERE track_inventory = true;
    END IF;
END $$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION decrement_promotion_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_promotion_usage(UUID) TO authenticated;

-- Verify everything is working
SELECT 
    'Decrement function' as component,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'decrement_promotion_usage'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
    'Increment function',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'increment_promotion_usage'
    ) THEN '✅ Created' ELSE '❌ Missing' END
UNION ALL
SELECT 
    'Products inventory constraint',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_inventory'
    ) THEN '✅ Applied' ELSE '❌ Missing' END
UNION ALL
SELECT 
    'Product variants inventory constraint',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_variant_inventory'
    ) THEN '✅ Applied' ELSE '❌ Missing' END
UNION ALL
SELECT 
    'Products low_stock_threshold column',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
    ) THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT 
    'Variants low_stock_threshold column',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'low_stock_threshold'
    ) THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT 
    'Products low stock constraint',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_low_stock_threshold'
    ) THEN '✅ Applied' ELSE 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
        ) THEN 'ℹ️ Column exists, constraint missing' ELSE 'ℹ️ Column missing' END
    END
UNION ALL
SELECT 
    'Variants low stock constraint',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_variant_low_stock_threshold'
    ) THEN '✅ Applied' ELSE 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_variants' AND column_name = 'low_stock_threshold'
        ) THEN 'ℹ️ Column exists, constraint missing' ELSE 'ℹ️ Column missing' END
    END; 