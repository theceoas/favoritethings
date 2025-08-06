-- Enhanced Product Variants System for Multiple Sizes and Colors
-- This version handles existing tables and missing columns properly

-- First, let's drop the existing table if it exists and recreate it properly
DROP TABLE IF EXISTS product_variants CASCADE;

-- Create the product_variants table with all required columns
CREATE TABLE product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant identification
  title VARCHAR(255) NOT NULL, -- e.g., "Queen Size - White"
  sku VARCHAR(100) UNIQUE NOT NULL,
  
  -- Pricing (can override main product price)
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  
  -- Inventory
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Physical properties
  weight DECIMAL(8,3), -- in kg
  dimensions JSONB, -- {"length": 200, "width": 150, "height": 5} in cm
  
  -- Variant-specific attributes
  size VARCHAR(50), -- "Twin", "Full", "Queen", "King", "California King"
  color VARCHAR(50), -- "White", "Gray", "Navy Blue", "Beige"
  material VARCHAR(100), -- "100% Cotton", "Bamboo Blend", "Microfiber"
  pattern VARCHAR(50), -- "Solid", "Striped", "Floral", "Geometric"
  thread_count VARCHAR(20), -- "200", "400", "600", "800"
  
  -- Images (variants can have their own images)
  featured_image TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Additional variant data (flexible JSON for future attributes)
  variant_data JSONB DEFAULT '{}',
  
  -- Ordering and status
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- One variant should be the default
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_active ON product_variants(is_active);
CREATE INDEX idx_product_variants_size ON product_variants(size);
CREATE INDEX idx_product_variants_color ON product_variants(color);
CREATE INDEX idx_product_variants_price ON product_variants(price);
CREATE INDEX idx_product_variants_inventory ON product_variants(inventory_quantity);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at 
    BEFORE UPDATE ON product_variants 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to active product variants" ON product_variants;
DROP POLICY IF EXISTS "Allow full access to product variants for authenticated users" ON product_variants;

-- Allow everyone to read active variants
CREATE POLICY "Allow read access to active product variants" ON product_variants
    FOR SELECT USING (is_active = true);

-- Allow authenticated users full access (for admin)
CREATE POLICY "Allow full access to product variants for authenticated users" ON product_variants
    FOR ALL USING (auth.role() = 'authenticated');

-- Also need to update the cart items table to support variants
-- Add variant_id to cart items if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cart_items' AND column_name = 'variant_id') THEN
        ALTER TABLE cart_items ADD COLUMN variant_id UUID REFERENCES product_variants(id);
    END IF;
END $$;

-- Also add variant support to order_items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'variant_id') THEN
        ALTER TABLE order_items ADD COLUMN variant_id UUID REFERENCES product_variants(id);
        ALTER TABLE order_items ADD COLUMN variant_title VARCHAR(255);
        ALTER TABLE order_items ADD COLUMN size VARCHAR(50);
        ALTER TABLE order_items ADD COLUMN color VARCHAR(50);
    END IF;
END $$;

-- Create sample product with variants
DO $$
DECLARE
    sheet_product_id UUID;
    pillow_product_id UUID;
    duvet_product_id UUID;
BEGIN
    -- Create a sheet set product
    INSERT INTO products (
        title,
        slug,
        description,
        short_description,
        price,
        sku,
        is_active,
        track_inventory,
        featured_image,
        images
    ) VALUES (
        'Egyptian Cotton Sheet Set',
        'egyptian-cotton-sheet-set',
        'Luxurious 100% Egyptian cotton sheet set with deep pockets and silky smooth finish. Available in multiple sizes and colors to match any bedroom decor.',
        'Premium Egyptian cotton sheets in multiple sizes and colors',
        89.99,
        'SHEET-EGY-001',
        true,
        false, -- We track inventory at variant level
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
        ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80']
    ) 
    ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO sheet_product_id;

    -- Create variants for the sheet set
    INSERT INTO product_variants (
        product_id, title, sku, price, compare_at_price, size, color, material, 
        inventory_quantity, sort_order, is_default, dimensions, thread_count, is_active
    ) VALUES 
    -- Twin Size
    (sheet_product_id, 'Twin - White', 'SHEET-EGY-001-TW-WHT', 89.99, 109.99, 'Twin', 'White', '100% Egyptian Cotton', 25, 1, true, '{"length": 190, "width": 99, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'Twin - Gray', 'SHEET-EGY-001-TW-GRY', 89.99, 109.99, 'Twin', 'Gray', '100% Egyptian Cotton', 15, 2, false, '{"length": 190, "width": 99, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'Twin - Navy', 'SHEET-EGY-001-TW-NVY', 89.99, 109.99, 'Twin', 'Navy', '100% Egyptian Cotton', 12, 3, false, '{"length": 190, "width": 99, "fitted_depth": 35}', '400', true),
    
    -- Full Size
    (sheet_product_id, 'Full - White', 'SHEET-EGY-001-FL-WHT', 109.99, 129.99, 'Full', 'White', '100% Egyptian Cotton', 20, 4, false, '{"length": 190, "width": 135, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'Full - Gray', 'SHEET-EGY-001-FL-GRY', 109.99, 129.99, 'Full', 'Gray', '100% Egyptian Cotton', 12, 5, false, '{"length": 190, "width": 135, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'Full - Navy', 'SHEET-EGY-001-FL-NVY', 109.99, 129.99, 'Full', 'Navy', '100% Egyptian Cotton', 8, 6, false, '{"length": 190, "width": 135, "fitted_depth": 35}', '400', true),
    
    -- Queen Size (most popular)
    (sheet_product_id, 'Queen - White', 'SHEET-EGY-001-QN-WHT', 129.99, 149.99, 'Queen', 'White', '100% Egyptian Cotton', 35, 7, false, '{"length": 200, "width": 150, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'Queen - Gray', 'SHEET-EGY-001-QN-GRY', 129.99, 149.99, 'Queen', 'Gray', '100% Egyptian Cotton', 25, 8, false, '{"length": 200, "width": 150, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'Queen - Navy', 'SHEET-EGY-001-QN-NVY', 129.99, 149.99, 'Queen', 'Navy', '100% Egyptian Cotton', 18, 9, false, '{"length": 200, "width": 150, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'Queen - Beige', 'SHEET-EGY-001-QN-BGE', 129.99, 149.99, 'Queen', 'Beige', '100% Egyptian Cotton', 15, 10, false, '{"length": 200, "width": 150, "fitted_depth": 35}', '400', true),
    
    -- King Size
    (sheet_product_id, 'King - White', 'SHEET-EGY-001-KG-WHT', 149.99, 179.99, 'King', 'White', '100% Egyptian Cotton', 20, 11, false, '{"length": 200, "width": 180, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'King - Gray', 'SHEET-EGY-001-KG-GRY', 149.99, 179.99, 'King', 'Gray', '100% Egyptian Cotton', 15, 12, false, '{"length": 200, "width": 180, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'King - Navy', 'SHEET-EGY-001-KG-NVY', 149.99, 179.99, 'King', 'Navy', '100% Egyptian Cotton', 10, 13, false, '{"length": 200, "width": 180, "fitted_depth": 35}', '400', true),
    
    -- California King Size
    (sheet_product_id, 'California King - White', 'SHEET-EGY-001-CK-WHT', 159.99, 189.99, 'California King', 'White', '100% Egyptian Cotton', 12, 14, false, '{"length": 215, "width": 180, "fitted_depth": 35}', '400', true),
    (sheet_product_id, 'California King - Gray', 'SHEET-EGY-001-CK-GRY', 159.99, 189.99, 'California King', 'Gray', '100% Egyptian Cotton', 8, 15, false, '{"length": 215, "width": 180, "fitted_depth": 35}', '400', true);

    -- Create a pillow product with size variants
    INSERT INTO products (
        title,
        slug,
        description,
        short_description,
        price,
        sku,
        is_active,
        track_inventory,
        featured_image,
        images
    ) VALUES (
        'Memory Foam Pillow',
        'memory-foam-pillow',
        'Premium memory foam pillow with cooling gel layer. Provides optimal neck and head support for a comfortable night sleep.',
        'Memory foam pillow with cooling gel in multiple sizes',
        25.99,
        'PILLOW-MEM-001',
        true,
        false,
        'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80',
        ARRAY['https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80']
    ) 
    ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO pillow_product_id;

    -- Create pillow variants
    INSERT INTO product_variants (
        product_id, title, sku, price, compare_at_price, size, color, material, 
        inventory_quantity, sort_order, is_default, dimensions, is_active
    ) VALUES 
    (pillow_product_id, 'Standard - White', 'PILLOW-MEM-001-STD-WHT', 25.99, 32.99, 'Standard', 'White', 'Memory Foam', 40, 1, true, '{"length": 51, "width": 66, "height": 12}', true),
    (pillow_product_id, 'Queen - White', 'PILLOW-MEM-001-QN-WHT', 29.99, 36.99, 'Queen', 'White', 'Memory Foam', 25, 2, false, '{"length": 51, "width": 71, "height": 12}', true),
    (pillow_product_id, 'King - White', 'PILLOW-MEM-001-KG-WHT', 34.99, 41.99, 'King', 'White', 'Memory Foam', 20, 3, false, '{"length": 51, "width": 91, "height": 12}', true);

    -- Update the main products to show the starting price
    UPDATE products 
    SET 
        price = (SELECT MIN(price) FROM product_variants WHERE product_id = products.id AND is_active = true),
        track_inventory = false
    WHERE id IN (sheet_product_id, pillow_product_id);

    RAISE NOTICE 'Successfully created product variants:';
    RAISE NOTICE 'Sheet set variants: %', (SELECT COUNT(*) FROM product_variants WHERE product_id = sheet_product_id);
    RAISE NOTICE 'Pillow variants: %', (SELECT COUNT(*) FROM product_variants WHERE product_id = pillow_product_id);
END $$;

-- Create the view for easier querying
DROP VIEW IF EXISTS products_with_variants;
CREATE VIEW products_with_variants AS
SELECT 
    p.*,
    -- Variants as JSON array
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
                'thread_count', pv.thread_count,
                'inventory_quantity', pv.inventory_quantity,
                'low_stock_threshold', pv.low_stock_threshold,
                'is_default', pv.is_default,
                'is_active', pv.is_active,
                'dimensions', pv.dimensions,
                'sort_order', pv.sort_order,
                'featured_image', pv.featured_image,
                'images', pv.images
            ) ORDER BY pv.sort_order
        ) FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.is_active = true),
        '[]'::json
    ) as variants,
    
    -- Price range for display
    CASE 
        WHEN (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id AND is_active = true) > 1 THEN
            (SELECT MIN(price) FROM product_variants WHERE product_id = p.id AND is_active = true)
        ELSE p.price
    END as price_from,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id AND is_active = true) > 1 THEN
            (SELECT MAX(price) FROM product_variants WHERE product_id = p.id AND is_active = true)
        ELSE p.price
    END as price_to,
    
    -- Available options (ordered)
    (SELECT array_agg(DISTINCT pv.size ORDER BY pv.size) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true AND pv.size IS NOT NULL) as available_sizes,
     
    (SELECT array_agg(DISTINCT pv.color ORDER BY pv.color) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true AND pv.color IS NOT NULL) as available_colors,
     
    -- Total inventory across all variants
    (SELECT COALESCE(SUM(pv.inventory_quantity), 0) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true) as total_inventory,
     
    -- Whether product has variants
    (SELECT COUNT(*) > 0 FROM product_variants WHERE product_id = p.id AND is_active = true) as has_variants,
    
    -- Default variant ID
    (SELECT pv.id FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true AND pv.is_default = true 
     LIMIT 1) as default_variant_id

FROM products p
WHERE p.is_active = true;

-- Add helpful comments
COMMENT ON TABLE product_variants IS 'Product variants for handling different sizes, colors, and options with individual inventory tracking';
COMMENT ON COLUMN product_variants.dimensions IS 'JSON object storing length, width, height, fitted_depth in cm';
COMMENT ON COLUMN product_variants.variant_data IS 'Flexible JSON field for additional variant attributes';
COMMENT ON VIEW products_with_variants IS 'Products with their variants aggregated for easy querying and display';

-- Final verification
SELECT 
    'Products with variants:' as description, 
    COUNT(*) as count 
FROM products_with_variants 
WHERE has_variants = true
UNION ALL
SELECT 
    'Total variants created:', 
    COUNT(*) 
FROM product_variants
WHERE is_active = true; 