-- Enhanced Product Variants System for Multiple Sizes
-- This allows one product to have multiple variations (sizes, colors, materials, etc.)

-- First, let's check if product_variants table exists and update it
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant identification
  title VARCHAR(255) NOT NULL, -- e.g., "Queen Size", "King Size - White", etc.
  sku VARCHAR(100) UNIQUE NOT NULL,
  
  -- Pricing (can override main product price)
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2), -- Original price for sale calculations
  cost_price DECIMAL(10,2), -- For profit calculations
  
  -- Inventory
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  
  -- Physical properties
  weight DECIMAL(8,3), -- in kg
  dimensions JSONB, -- {"length": 200, "width": 150, "height": 5} in cm
  
  -- Variant-specific attributes
  size VARCHAR(50), -- "Twin", "Full", "Queen", "King", "California King"
  color VARCHAR(50), -- "White", "Gray", "Navy Blue"
  material VARCHAR(100), -- "100% Cotton", "Bamboo Blend"
  pattern VARCHAR(50), -- "Solid", "Striped", "Floral"
  
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
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON product_variants(color);

-- Ensure updated_at is automatically updated
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at 
    BEFORE UPDATE ON product_variants 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to active product variants" ON product_variants;
DROP POLICY IF EXISTS "Allow full access to product variants for authenticated users" ON product_variants;

-- Allow everyone to read active variants
CREATE POLICY "Allow read access to active product variants" ON product_variants
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to read all variants (for admin)
CREATE POLICY "Allow full access to product variants for authenticated users" ON product_variants
    FOR ALL USING (auth.role() = 'authenticated');

-- Sample data: Let's create variants for a bedding product
-- First, let's assume we have a "Luxury Cotton Sheet Set" product

DO $$
DECLARE
    sheet_product_id UUID;
BEGIN
    -- Get or create the main product
    INSERT INTO products (
        title,
        slug,
        description,
        price, -- This will be the base/starting price
        sku,
        is_active,
        track_inventory
    ) VALUES (
        'Luxury Cotton Sheet Set',
        'luxury-cotton-sheet-set',
        'Premium 100% cotton sheet set with deep pockets and silky smooth finish',
        89.99, -- Base price (maybe Twin size)
        'SHEET-LUX-001',
        true,
        false -- We track inventory at variant level
    ) 
    ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description
    RETURNING id INTO sheet_product_id;

    -- Create size variants for the sheet set
    INSERT INTO product_variants (
        product_id,
        title,
        sku,
        price,
        compare_at_price,
        size,
        color,
        material,
        inventory_quantity,
        sort_order,
        is_default,
        dimensions
    ) VALUES 
    -- Twin Size
    (sheet_product_id, 'Twin Size - White', 'SHEET-LUX-001-TW-WHT', 89.99, 109.99, 'Twin', 'White', '100% Cotton', 25, 1, true, '{"length": 190, "width": 99, "fitted_depth": 35}'),
    (sheet_product_id, 'Twin Size - Gray', 'SHEET-LUX-001-TW-GRY', 89.99, 109.99, 'Twin', 'Gray', '100% Cotton', 15, 2, false, '{"length": 190, "width": 99, "fitted_depth": 35}'),
    
    -- Full Size
    (sheet_product_id, 'Full Size - White', 'SHEET-LUX-001-FL-WHT', 109.99, 129.99, 'Full', 'White', '100% Cotton', 20, 3, false, '{"length": 190, "width": 135, "fitted_depth": 35}'),
    (sheet_product_id, 'Full Size - Gray', 'SHEET-LUX-001-FL-GRY', 109.99, 129.99, 'Full', 'Gray', '100% Cotton', 12, 4, false, '{"length": 190, "width": 135, "fitted_depth": 35}'),
    
    -- Queen Size  
    (sheet_product_id, 'Queen Size - White', 'SHEET-LUX-001-QN-WHT', 129.99, 149.99, 'Queen', 'White', '100% Cotton', 30, 5, false, '{"length": 200, "width": 150, "fitted_depth": 35}'),
    (sheet_product_id, 'Queen Size - Gray', 'SHEET-LUX-001-QN-GRY', 129.99, 149.99, 'Queen', 'Gray', '100% Cotton', 18, 6, false, '{"length": 200, "width": 150, "fitted_depth": 35}'),
    (sheet_product_id, 'Queen Size - Navy', 'SHEET-LUX-001-QN-NVY', 129.99, 149.99, 'Queen', 'Navy', '100% Cotton', 10, 7, false, '{"length": 200, "width": 150, "fitted_depth": 35}'),
    
    -- King Size
    (sheet_product_id, 'King Size - White', 'SHEET-LUX-001-KG-WHT', 149.99, 179.99, 'King', 'White', '100% Cotton', 15, 8, false, '{"length": 200, "width": 180, "fitted_depth": 35}'),
    (sheet_product_id, 'King Size - Gray', 'SHEET-LUX-001-KG-GRY', 149.99, 179.99, 'King', 'Gray', '100% Cotton', 8, 9, false, '{"length": 200, "width": 180, "fitted_depth": 35}'),
    
    -- California King Size  
    (sheet_product_id, 'California King - White', 'SHEET-LUX-001-CK-WHT', 159.99, 189.99, 'California King', 'White', '100% Cotton', 12, 10, false, '{"length": 215, "width": 180, "fitted_depth": 35}'),
    (sheet_product_id, 'California King - Gray', 'SHEET-LUX-001-CK-GRY', 159.99, 189.99, 'California King', 'Gray', '100% Cotton', 6, 11, false, '{"length": 215, "width": 180, "fitted_depth": 35}');

    RAISE NOTICE 'Product variants created successfully for product ID: %', sheet_product_id;
END $$;

-- Update the main product to reflect that it has variants
UPDATE products 
SET 
    price = (SELECT MIN(price) FROM product_variants WHERE product_id = products.id AND is_active = true),
    track_inventory = false -- Inventory tracked at variant level
WHERE id IN (SELECT DISTINCT product_id FROM product_variants);

-- Create a view for easier querying of products with their variants  
DROP VIEW IF EXISTS products_with_variants;
CREATE VIEW products_with_variants AS
SELECT 
    p.*,
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
                'inventory_quantity', pv.inventory_quantity,
                'is_default', pv.is_default,
                'is_active', pv.is_active,
                'dimensions', pv.dimensions
            )
        ) FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.is_active = true
        ORDER BY pv.sort_order),
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
    
    -- Available sizes
    (SELECT array_agg(DISTINCT pv.size ORDER BY pv.size) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true) as available_sizes,
     
    -- Available colors  
    (SELECT array_agg(DISTINCT pv.color ORDER BY pv.color) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true) as available_colors,
     
    -- Total inventory across all variants
    (SELECT COALESCE(SUM(pv.inventory_quantity), 0) 
     FROM product_variants pv 
     WHERE pv.product_id = p.id AND pv.is_active = true) as total_inventory

FROM products p
WHERE p.is_active = true; 