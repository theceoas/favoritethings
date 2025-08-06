-- Super Safe Filter Migration Script
-- This checks everything before attempting operations

-- Step 1: Drop existing triggers only if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_filters' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_category_filters_updated_at ON category_filters;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_filter_options' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_category_filter_options_updated_at ON category_filter_options;
    END IF;
END $$;

-- Step 2: Create category_filters table
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

-- Step 3: Create category_filter_options table
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

-- Step 4: Create category_filter_assignments table
CREATE TABLE IF NOT EXISTS category_filter_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    filter_id UUID NOT NULL REFERENCES category_filters(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, filter_id)
);

-- Step 5: Handle product_filter_values table migration
DO $$
BEGIN
    -- Check if product_filter_values exists with old structure (has 'value' column)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_filter_values' 
        AND column_name = 'value'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Found old product_filter_values structure, migrating...';
        
        -- Backup existing data
        DROP TABLE IF EXISTS product_filter_values_old;
        CREATE TABLE product_filter_values_old AS 
        SELECT * FROM product_filter_values;
        
        -- Drop the old table
        DROP TABLE product_filter_values CASCADE;
        
        RAISE NOTICE 'Backed up old filter data and dropped old table structure';
        
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'product_filter_values' 
        AND table_schema = 'public'
    ) THEN
        -- Table exists, check if it has the correct structure
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_filter_values' 
            AND column_name = 'filter_option_id'
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'product_filter_values exists but has wrong structure, recreating...';
            DROP TABLE IF EXISTS product_filter_values_old;
            CREATE TABLE product_filter_values_old AS 
            SELECT * FROM product_filter_values;
            DROP TABLE product_filter_values CASCADE;
        ELSE
            RAISE NOTICE 'product_filter_values already has correct structure, skipping migration';
        END IF;
    ELSE
        RAISE NOTICE 'product_filter_values does not exist, will create new table';
    END IF;
END $$;

-- Step 6: Create new product_filter_values table with correct structure
CREATE TABLE IF NOT EXISTS product_filter_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    filter_id UUID NOT NULL REFERENCES category_filters(id) ON DELETE CASCADE,
    filter_option_id UUID NOT NULL REFERENCES category_filter_options(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, filter_id, filter_option_id)
);

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_category_filter_options_filter_id ON category_filter_options(filter_id);
CREATE INDEX IF NOT EXISTS idx_category_filter_options_active ON category_filter_options(is_active);
CREATE INDEX IF NOT EXISTS idx_category_filter_assignments_category ON category_filter_assignments(category_id);
CREATE INDEX IF NOT EXISTS idx_category_filter_assignments_filter ON category_filter_assignments(filter_id);
CREATE INDEX IF NOT EXISTS idx_product_filter_values_product ON product_filter_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_filter_values_filter ON product_filter_values(filter_id);
CREATE INDEX IF NOT EXISTS idx_product_filter_values_option ON product_filter_values(filter_option_id);

-- Step 8: Create function for triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create triggers
CREATE TRIGGER update_category_filters_updated_at 
    BEFORE UPDATE ON category_filters 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_category_filter_options_updated_at 
    BEFORE UPDATE ON category_filter_options 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Step 10: Enable RLS on all tables
ALTER TABLE category_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_filter_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_filter_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_filter_values ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies (drop existing ones first)
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Allow all operations on category_filters" ON category_filters;
    DROP POLICY IF EXISTS "Allow all operations on category_filter_options" ON category_filter_options;
    DROP POLICY IF EXISTS "Allow all operations on category_filter_assignments" ON category_filter_assignments;
    DROP POLICY IF EXISTS "Allow all operations on product_filter_values" ON product_filter_values;
    
    -- Create new policies
    CREATE POLICY "Allow all operations on category_filters" ON category_filters FOR ALL USING (true);
    CREATE POLICY "Allow all operations on category_filter_options" ON category_filter_options FOR ALL USING (true);
    CREATE POLICY "Allow all operations on category_filter_assignments" ON category_filter_assignments FOR ALL USING (true);
    CREATE POLICY "Allow all operations on product_filter_values" ON product_filter_values FOR ALL USING (true);
END $$;

-- Step 12: Insert sample filter data
DO $$
DECLARE
    size_filter_id UUID;
    color_filter_id UUID;
    material_filter_id UUID;
    thread_count_filter_id UUID;
    pattern_filter_id UUID;
    brand_filter_id UUID;
BEGIN
    RAISE NOTICE 'Inserting sample filter data...';
    
    -- Insert Size filter
    INSERT INTO category_filters (name, slug, color, sort_order) 
    VALUES ('Size', 'size', '#3b82f6', 1) 
    ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name, 
        color = EXCLUDED.color,
        sort_order = EXCLUDED.sort_order
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
    INSERT INTO category_filters (name, slug, color, sort_order) 
    VALUES ('Color', 'color', '#ef4444', 2) 
    ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name, 
        color = EXCLUDED.color,
        sort_order = EXCLUDED.sort_order
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
    INSERT INTO category_filters (name, slug, color, sort_order) 
    VALUES ('Material', 'material', '#10b981', 3) 
    ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name, 
        color = EXCLUDED.color,
        sort_order = EXCLUDED.sort_order
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
    INSERT INTO category_filters (name, slug, color, sort_order) 
    VALUES ('Thread Count', 'thread-count', '#f59e0b', 4) 
    ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name, 
        color = EXCLUDED.color,
        sort_order = EXCLUDED.sort_order
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
    INSERT INTO category_filters (name, slug, color, sort_order) 
    VALUES ('Pattern', 'pattern', '#8b5cf6', 5) 
    ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name, 
        color = EXCLUDED.color,
        sort_order = EXCLUDED.sort_order
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
    INSERT INTO category_filters (name, slug, color, sort_order) 
    VALUES ('Brand', 'brand', '#6366f1', 6) 
    ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name, 
        color = EXCLUDED.color,
        sort_order = EXCLUDED.sort_order
    RETURNING id INTO brand_filter_id;

    -- Insert Brand options
    INSERT INTO category_filter_options (filter_id, name, slug, sort_order) VALUES
    (brand_filter_id, 'Bedz&Buttunz', 'bedz-buttunz', 1),
    (brand_filter_id, 'Premium Collection', 'premium-collection', 2),
    (brand_filter_id, 'Luxury Line', 'luxury-line', 3),
    (brand_filter_id, 'Comfort Series', 'comfort-series', 4)
    ON CONFLICT (filter_id, slug) DO NOTHING;

    RAISE NOTICE '';
    RAISE NOTICE '🎉 SUCCESS! Filter migration completed!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created filter types:';
    RAISE NOTICE '   • Size (6 options)';
    RAISE NOTICE '   • Color (10 options)';
    RAISE NOTICE '   • Material (7 options)';
    RAISE NOTICE '   • Thread Count (5 options)';
    RAISE NOTICE '   • Pattern (7 options)';
    RAISE NOTICE '   • Brand (4 options)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Go to /admin/categories/filters to manage filters';
    RAISE NOTICE '   2. Assign filters to categories';
    RAISE NOTICE '   3. Create products with filter options';
    RAISE NOTICE '   4. See filters in action at /products?category=<category>';
    RAISE NOTICE '';
    RAISE NOTICE '💾 Any old filter data is backed up in product_filter_values_old table';
    
END $$; 