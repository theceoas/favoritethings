-- Enhanced Category Filters Database Schema
-- This creates a complete filter system with predefined options

-- Create category_filters table (filter types like "Color", "Size", etc.)
CREATE TABLE IF NOT EXISTS category_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create category_filter_options table (predefined options for each filter)
CREATE TABLE IF NOT EXISTS category_filter_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filter_id UUID NOT NULL REFERENCES category_filters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(filter_id, slug)
);

-- Create category_filter_assignments table (which filters are assigned to which categories)
CREATE TABLE IF NOT EXISTS category_filter_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    filter_id UUID NOT NULL REFERENCES category_filters(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, filter_id)
);

-- Update product_filter_values to reference filter options instead of free text
CREATE TABLE IF NOT EXISTS product_filter_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    filter_id UUID NOT NULL REFERENCES category_filters(id) ON DELETE CASCADE,
    filter_option_id UUID NOT NULL REFERENCES category_filter_options(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, filter_id, filter_option_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_category_filter_options_filter_id ON category_filter_options(filter_id);
CREATE INDEX IF NOT EXISTS idx_category_filter_options_active ON category_filter_options(is_active);
CREATE INDEX IF NOT EXISTS idx_category_filter_assignments_category ON category_filter_assignments(category_id);
CREATE INDEX IF NOT EXISTS idx_category_filter_assignments_filter ON category_filter_assignments(filter_id);
CREATE INDEX IF NOT EXISTS idx_product_filter_values_product ON product_filter_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_filter_values_filter ON product_filter_values(filter_id);
CREATE INDEX IF NOT EXISTS idx_product_filter_values_option ON product_filter_values(filter_option_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_category_filters_updated_at BEFORE UPDATE ON category_filters FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_category_filter_options_updated_at BEFORE UPDATE ON category_filter_options FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE category_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_filter_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_filter_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_filter_values ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - adjust based on your auth setup)
CREATE POLICY "Allow all operations on category_filters" ON category_filters FOR ALL USING (true);
CREATE POLICY "Allow all operations on category_filter_options" ON category_filter_options FOR ALL USING (true);
CREATE POLICY "Allow all operations on category_filter_assignments" ON category_filter_assignments FOR ALL USING (true);
CREATE POLICY "Allow all operations on product_filter_values" ON product_filter_values FOR ALL USING (true);

-- Insert default filters with predefined options
DO $$
DECLARE
    size_filter_id UUID;
    color_filter_id UUID;
    material_filter_id UUID;
    thread_count_filter_id UUID;
    pattern_filter_id UUID;
    brand_filter_id UUID;
BEGIN
    -- Insert Size filter
    INSERT INTO category_filters (name, slug, color) 
    VALUES ('Size', 'size', '#3b82f6') 
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color
    RETURNING id INTO size_filter_id;

    -- Insert Size options
    INSERT INTO category_filter_options (filter_id, name, slug, sort_order) VALUES
    (size_filter_id, 'Twin', 'twin', 1),
    (size_filter_id, 'Twin XL', 'twin-xl', 2),
    (size_filter_id, 'Full', 'full', 3),
    (size_filter_id, 'Queen', 'queen', 4),
    (size_filter_id, 'King', 'king', 5),
    (size_filter_id, 'California King', 'california-king', 6)
    ON CONFLICT (filter_id, slug) DO NOTHING;

    -- Insert Color filter
    INSERT INTO category_filters (name, slug, color) 
    VALUES ('Color', 'color', '#ef4444') 
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color
    RETURNING id INTO color_filter_id;

    -- Insert Color options
    INSERT INTO category_filter_options (filter_id, name, slug, sort_order) VALUES
    (color_filter_id, 'White', 'white', 1),
    (color_filter_id, 'Black', 'black', 2),
    (color_filter_id, 'Gray', 'gray', 3),
    (color_filter_id, 'Blue', 'blue', 4),
    (color_filter_id, 'Red', 'red', 5),
    (color_filter_id, 'Green', 'green', 6),
    (color_filter_id, 'Purple', 'purple', 7),
    (color_filter_id, 'Pink', 'pink', 8),
    (color_filter_id, 'Brown', 'brown', 9),
    (color_filter_id, 'Beige', 'beige', 10)
    ON CONFLICT (filter_id, slug) DO NOTHING;

    -- Insert Material filter
    INSERT INTO category_filters (name, slug, color) 
    VALUES ('Material', 'material', '#10b981') 
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color
    RETURNING id INTO material_filter_id;

    -- Insert Material options
    INSERT INTO category_filter_options (filter_id, name, slug, sort_order) VALUES
    (material_filter_id, '100% Cotton', '100-cotton', 1),
    (material_filter_id, 'Egyptian Cotton', 'egyptian-cotton', 2),
    (material_filter_id, 'Bamboo', 'bamboo', 3),
    (material_filter_id, 'Linen', 'linen', 4),
    (material_filter_id, 'Microfiber', 'microfiber', 5),
    (material_filter_id, 'Silk', 'silk', 6),
    (material_filter_id, 'Cotton Blend', 'cotton-blend', 7)
    ON CONFLICT (filter_id, slug) DO NOTHING;

    -- Insert Thread Count filter
    INSERT INTO category_filters (name, slug, color) 
    VALUES ('Thread Count', 'thread-count', '#f59e0b') 
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color
    RETURNING id INTO thread_count_filter_id;

    -- Insert Thread Count options
    INSERT INTO category_filter_options (filter_id, name, slug, sort_order) VALUES
    (thread_count_filter_id, '200-300', '200-300', 1),
    (thread_count_filter_id, '300-400', '300-400', 2),
    (thread_count_filter_id, '400-500', '400-500', 3),
    (thread_count_filter_id, '500-600', '500-600', 4),
    (thread_count_filter_id, '600+', '600-plus', 5)
    ON CONFLICT (filter_id, slug) DO NOTHING;

    -- Insert Pattern filter
    INSERT INTO category_filters (name, slug, color) 
    VALUES ('Pattern', 'pattern', '#8b5cf6') 
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color
    RETURNING id INTO pattern_filter_id;

    -- Insert Pattern options
    INSERT INTO category_filter_options (filter_id, name, slug, sort_order) VALUES
    (pattern_filter_id, 'Solid', 'solid', 1),
    (pattern_filter_id, 'Striped', 'striped', 2),
    (pattern_filter_id, 'Floral', 'floral', 3),
    (pattern_filter_id, 'Geometric', 'geometric', 4),
    (pattern_filter_id, 'Checkered', 'checkered', 5),
    (pattern_filter_id, 'Paisley', 'paisley', 6),
    (pattern_filter_id, 'Abstract', 'abstract', 7)
    ON CONFLICT (filter_id, slug) DO NOTHING;

    -- Insert Brand filter
    INSERT INTO category_filters (name, slug, color) 
    VALUES ('Brand', 'brand', '#6366f1') 
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color
    RETURNING id INTO brand_filter_id;

    -- Insert Brand options
    INSERT INTO category_filter_options (filter_id, name, slug, sort_order) VALUES
    (brand_filter_id, 'Bedz&Buttunz', 'bedz-buttunz', 1),
    (brand_filter_id, 'Premium Collection', 'premium-collection', 2),
    (brand_filter_id, 'Luxury Line', 'luxury-line', 3),
    (brand_filter_id, 'Comfort Series', 'comfort-series', 4)
    ON CONFLICT (filter_id, slug) DO NOTHING;

END $$; 