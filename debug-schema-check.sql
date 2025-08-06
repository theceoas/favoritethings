-- Debug script to check actual database schema
-- This will show us exactly what columns exist in product_variants table

-- Check what columns exist in product_variants table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'product_variants'
ORDER BY ordinal_position;

-- Check if any product variants exist
SELECT 
    'Product variants count' as description,
    COUNT(*) as count
FROM product_variants;

-- Check if any products exist
SELECT 
    'Products count' as description,
    COUNT(*) as count
FROM products;

-- Try to select basic fields from product_variants to see what works
SELECT 
    id,
    product_id,
    title,
    sku,
    price,
    inventory_quantity,
    is_active
FROM product_variants
LIMIT 3;

-- Check for track_inventory column specifically
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_variants' 
            AND column_name = 'track_inventory'
        ) 
        THEN 'track_inventory column EXISTS'
        ELSE 'track_inventory column MISSING'
    END as track_inventory_status;

-- Check for featured_image column specifically  
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_variants' 
            AND column_name = 'featured_image'
        ) 
        THEN 'featured_image column EXISTS'
        ELSE 'featured_image column MISSING'
    END as featured_image_status;

-- Check for image_url column specifically
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_variants' 
            AND column_name = 'image_url'
        ) 
        THEN 'image_url column EXISTS'
        ELSE 'image_url column MISSING'
    END as image_url_status; 