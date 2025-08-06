-- Comprehensive fix for inventory tracking schema issues
-- This migration ensures all required columns exist and fixes the products_with_variants view

-- 1. Ensure all required columns exist in product_variants table
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT false;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS featured_image TEXT;

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

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

-- 2. Update any NULL values to proper defaults
UPDATE product_variants SET track_inventory = true WHERE track_inventory IS NULL;
UPDATE product_variants SET allow_backorder = false WHERE allow_backorder IS NULL;
UPDATE product_variants SET low_stock_threshold = 5 WHERE low_stock_threshold IS NULL;
UPDATE product_variants SET sort_order = 0 WHERE sort_order IS NULL;
UPDATE product_variants SET is_default = false WHERE is_default IS NULL;
UPDATE product_variants SET inventory_quantity = 0 WHERE inventory_quantity IS NULL;

-- 3. Ensure products table has required columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;

UPDATE products SET track_inventory = true WHERE track_inventory IS NULL;

-- 4. Create improved products_with_variants view
DROP VIEW IF EXISTS products_with_variants CASCADE;

CREATE VIEW products_with_variants AS
SELECT 
    p.*,
    -- Variants as JSON array (only active variants)
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', pv.id,
                'title', pv.title,
                'sku', pv.sku,
                'price', pv.price,
                'compare_at_price', pv.compare_at_price,
                'size', pv.size,
                'color', pv.color,
                'material', pv.material,
                'pattern', pv.pattern,
                'thread_count', pv.thread_count,
                'inventory_quantity', pv.inventory_quantity,
                'track_inventory', pv.track_inventory,
                'allow_backorder', pv.allow_backorder,
                'low_stock_threshold', pv.low_stock_threshold,
                'is_default', pv.is_default,
                'is_active', pv.is_active,
                'dimensions', pv.dimensions,
                'sort_order', pv.sort_order,
                'featured_image', pv.featured_image,
                'images', pv.images,
                'variant_data', pv.variant_data
            ) ORDER BY pv.sort_order, pv.created_at
        ) FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.is_active = true),
        '[]'::json
    ) as variants,
    
    -- Price range for display
    CASE 
        WHEN EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id AND is_active = true) THEN
            (SELECT MIN(price) FROM product_variants WHERE product_id = p.id AND is_active = true)
        ELSE p.price
    END as price_from,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id AND is_active = true) THEN
            (SELECT MAX(price) FROM product_variants WHERE product_id = p.id AND is_active = true)
        ELSE p.price
    END as price_to,
    
    -- Available options (only from active variants)
    (SELECT array_agg(DISTINCT pv.size ORDER BY pv.size) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true AND pv.size IS NOT NULL) as available_sizes,
     
    (SELECT array_agg(DISTINCT pv.color ORDER BY pv.color) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true AND pv.color IS NOT NULL) as available_colors,
     
    -- CORRECTED: Total inventory across all ACTIVE variants only
    (SELECT COALESCE(SUM(
        CASE 
            WHEN pv.track_inventory = true THEN pv.inventory_quantity 
            ELSE 0 
        END
    ), 0) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true) as total_inventory,
     
    -- Whether product has active variants
    (SELECT COUNT(*) > 0 FROM product_variants WHERE product_id = p.id AND is_active = true) as has_variants,
    
    -- Default variant information
    (SELECT pv.id FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true AND pv.is_default = true 
     LIMIT 1) as default_variant_id,
     
    -- Lowest stock threshold among variants
    (SELECT MIN(pv.low_stock_threshold) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true) as min_low_stock_threshold,
     
    -- Check if any variant allows backorders
    (SELECT bool_or(pv.allow_backorder) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true) as allows_backorder

FROM products p
WHERE p.is_active = true;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_active_inventory 
ON product_variants(product_id, is_active, inventory_quantity);

CREATE INDEX IF NOT EXISTS idx_product_variants_track_inventory 
ON product_variants(track_inventory);

CREATE INDEX IF NOT EXISTS idx_product_variants_sort_order 
ON product_variants(sort_order);

CREATE INDEX IF NOT EXISTS idx_product_variants_is_default 
ON product_variants(is_default);

-- 6. Add helpful comments
COMMENT ON VIEW products_with_variants IS 'Optimized view for products with corrected inventory calculations - only includes active variants';
COMMENT ON COLUMN product_variants.track_inventory IS 'Whether this variant tracks inventory quantities';
COMMENT ON COLUMN product_variants.allow_backorder IS 'Whether this variant allows backorders when out of stock';

-- 7. Sample query to test the view
SELECT 
    title,
    has_variants,
    total_inventory,
    available_sizes,
    available_colors,
    price_from,
    price_to
FROM products_with_variants 
WHERE has_variants = true
LIMIT 5;

-- 8. Create a function to get correct stock for any product
CREATE OR REPLACE FUNCTION get_product_stock(product_id UUID)
RETURNS INTEGER AS $$
DECLARE
    stock_count INTEGER := 0;
    has_variants_count INTEGER := 0;
BEGIN
    -- Check if product has variants
    SELECT COUNT(*) INTO has_variants_count
    FROM product_variants 
    WHERE product_variants.product_id = get_product_stock.product_id 
    AND is_active = true;
    
    IF has_variants_count > 0 THEN
        -- Sum inventory from active variants that track inventory
        SELECT COALESCE(SUM(
            CASE 
                WHEN track_inventory = true THEN inventory_quantity 
                ELSE 0 
            END
        ), 0) INTO stock_count
        FROM product_variants 
        WHERE product_variants.product_id = get_product_stock.product_id 
        AND is_active = true;
    ELSE
        -- Use product's own inventory
        SELECT COALESCE(inventory_quantity, 0) INTO stock_count
        FROM products 
        WHERE id = get_product_stock.product_id 
        AND is_active = true;
    END IF;
    
    RETURN stock_count;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 
    p.title,
    get_product_stock(p.id) as calculated_stock,
    pwv.total_inventory as view_stock
FROM products p
JOIN products_with_variants pwv ON p.id = pwv.id
LIMIT 5; 