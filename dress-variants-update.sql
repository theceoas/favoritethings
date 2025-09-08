-- SQL to update product_variants table for dress business
-- This will add proper fields for dress sizes, colors, and pricing

-- First, let's see the current structure
-- \d product_variants;

-- Add new columns for dress-specific variants
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS size VARCHAR(10),
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS material VARCHAR(100),
ADD COLUMN IF NOT EXISTS care_instructions TEXT,
ADD COLUMN IF NOT EXISTS size_guide TEXT,
ADD COLUMN IF NOT EXISTS fit_type VARCHAR(50), -- 'Regular', 'Slim', 'Plus Size', etc.
ADD COLUMN IF NOT EXISTS occasion VARCHAR(100), -- 'Casual', 'Formal', 'Party', 'Wedding', etc.
ADD COLUMN IF NOT EXISTS season VARCHAR(20), -- 'Spring', 'Summer', 'Fall', 'Winter', 'All Season'
ADD COLUMN IF NOT EXISTS length VARCHAR(50), -- 'Mini', 'Midi', 'Maxi', 'Floor Length'
ADD COLUMN IF NOT EXISTS neckline VARCHAR(50), -- 'V-neck', 'Round', 'Off-shoulder', etc.
ADD COLUMN IF NOT EXISTS sleeve_type VARCHAR(50), -- 'Sleeveless', 'Short', 'Long', '3/4'
ADD COLUMN IF NOT EXISTS pattern VARCHAR(50), -- 'Solid', 'Floral', 'Striped', 'Polka Dot'
ADD COLUMN IF NOT EXISTS fabric_weight VARCHAR(20), -- 'Light', 'Medium', 'Heavy'
ADD COLUMN IF NOT EXISTS stretch BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lined BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_pockets BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_belt BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS closure_type VARCHAR(50), -- 'Zipper', 'Buttons', 'Pullover', 'Tie'
ADD COLUMN IF NOT EXISTS measurements JSONB, -- Store bust, waist, hip, length measurements
ADD COLUMN IF NOT EXISTS model_info JSONB; -- Store model size, height info for reference

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_variants_price ON product_variants(price);
CREATE INDEX IF NOT EXISTS idx_variants_inventory ON product_variants(inventory_quantity);
CREATE INDEX IF NOT EXISTS idx_variants_active ON product_variants(is_active);

-- Add constraints for dress business
ALTER TABLE product_variants 
ADD CONSTRAINT check_positive_price CHECK (price >= 0),
ADD CONSTRAINT check_positive_inventory CHECK (inventory_quantity >= 0);

-- Create a function to generate SKU for dress variants
CREATE OR REPLACE FUNCTION generate_dress_variant_sku(
  product_title TEXT,
  size_val TEXT,
  color_val TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(
    SUBSTRING(REGEXP_REPLACE(product_title, '[^a-zA-Z0-9]', '', 'g'), 1, 6) || 
    '-' || 
    COALESCE(size_val, 'OS') || 
    '-' || 
    SUBSTRING(REGEXP_REPLACE(COALESCE(color_val, 'DEF'), '[^a-zA-Z0-9]', '', 'g'), 1, 3)
  );
END;
$$ LANGUAGE plpgsql;

-- Example: Insert some sample dress variants
-- You can customize this based on your actual products

-- Common dress sizes for your business
-- You can modify these based on your sizing system
INSERT INTO product_variants (
  product_id, 
  title, 
  sku, 
  price, 
  compare_at_price,
  size, 
  color, 
  inventory_quantity,
  is_active,
  material,
  length,
  neckline,
  sleeve_type,
  occasion,
  season,
  measurements
) VALUES 
-- Example variants for a dress (replace with your actual product IDs)
-- ('your-product-id-here', 'Evening Dress - Size XS - Navy', 'EVDRES-XS-NAV', 89.99, 120.00, 'XS', 'Navy Blue', 5, true, '95% Polyester, 5% Spandex', 'Maxi', 'V-neck', 'Sleeveless', 'Formal', 'All Season', '{"bust": "32", "waist": "24", "hip": "34", "length": "58"}'),
-- ('your-product-id-here', 'Evening Dress - Size S - Navy', 'EVDRES-S-NAV', 89.99, 120.00, 'S', 'Navy Blue', 8, true, '95% Polyester, 5% Spandex', 'Maxi', 'V-neck', 'Sleeveless', 'Formal', 'All Season', '{"bust": "34", "waist": "26", "hip": "36", "length": "58"}'),
-- ('your-product-id-here', 'Evening Dress - Size M - Navy', 'EVDRES-M-NAV', 89.99, 120.00, 'M', 'Navy Blue', 10, true, '95% Polyester, 5% Spandex', 'Maxi', 'V-neck', 'Sleeveless', 'Formal', 'All Season', '{"bust": "36", "waist": "28", "hip": "38", "length": "58"}');

-- Create a view for easier variant management
CREATE OR REPLACE VIEW dress_variants_summary AS
SELECT 
  pv.id,
  p.title as product_title,
  pv.title as variant_title,
  pv.sku,
  pv.size,
  pv.color,
  pv.price,
  pv.compare_at_price,
  pv.inventory_quantity,
  pv.is_active,
  pv.material,
  pv.length,
  pv.neckline,
  pv.sleeve_type,
  pv.occasion,
  pv.season,
  pv.measurements,
  CASE 
    WHEN pv.inventory_quantity > 10 THEN 'In Stock'
    WHEN pv.inventory_quantity > 0 THEN 'Low Stock'
    ELSE 'Out of Stock'
  END as stock_status
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.is_active = true
ORDER BY p.title, pv.size, pv.color;

-- Function to update variant pricing in bulk
CREATE OR REPLACE FUNCTION update_variant_prices(
  p_product_id UUID,
  p_price_increase_percent DECIMAL DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE product_variants 
  SET 
    price = price * (1 + p_price_increase_percent / 100),
    updated_at = NOW()
  WHERE product_id = p_product_id AND is_active = true;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate SKU if not provided
CREATE OR REPLACE FUNCTION auto_generate_variant_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    SELECT title INTO NEW.sku FROM products WHERE id = NEW.product_id;
    NEW.sku := generate_dress_variant_sku(NEW.sku, NEW.size, NEW.color);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_variant_sku ON product_variants;
CREATE TRIGGER trigger_auto_generate_variant_sku
  BEFORE INSERT ON product_variants
  FOR EACH ROW EXECUTE FUNCTION auto_generate_variant_sku();

-- Sample query to check your current variants
-- SELECT * FROM dress_variants_summary LIMIT 10;

COMMENT ON TABLE product_variants IS 'Enhanced product variants table for dress business with size, color, material, and style options';
COMMENT ON COLUMN product_variants.size IS 'Dress size: XS, S, M, L, XL, XXL, or custom sizes';
COMMENT ON COLUMN product_variants.color IS 'Dress color name or description';
COMMENT ON COLUMN product_variants.material IS 'Fabric composition and material details';
COMMENT ON COLUMN product_variants.length IS 'Dress length: Mini, Midi, Maxi, Floor Length';
COMMENT ON COLUMN product_variants.neckline IS 'Neckline style: V-neck, Round, Off-shoulder, etc.';
COMMENT ON COLUMN product_variants.measurements IS 'JSON object with bust, waist, hip, length measurements'; 