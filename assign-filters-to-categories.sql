-- Assign filters to categories
-- This script assigns relevant filters to each category

DO $$
DECLARE
    pillows_category_id UUID;
    sheets_category_id UUID;
    bedding_category_id UUID;
    blankets_category_id UUID;
    
    size_filter_id UUID;
    color_filter_id UUID;
    material_filter_id UUID;
    pattern_filter_id UUID;
    brand_filter_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO pillows_category_id FROM categories WHERE slug = 'pillows' LIMIT 1;
    SELECT id INTO sheets_category_id FROM categories WHERE slug = 'sheets' LIMIT 1;
    SELECT id INTO bedding_category_id FROM categories WHERE slug = 'bedding' LIMIT 1;
    SELECT id INTO blankets_category_id FROM categories WHERE slug = 'blankets' LIMIT 1;
    
    -- Get filter IDs
    SELECT id INTO size_filter_id FROM category_filters WHERE slug = 'size' LIMIT 1;
    SELECT id INTO color_filter_id FROM category_filters WHERE slug = 'color' LIMIT 1;
    SELECT id INTO material_filter_id FROM category_filters WHERE slug = 'material' LIMIT 1;
    SELECT id INTO pattern_filter_id FROM category_filters WHERE slug = 'pattern' LIMIT 1;
    SELECT id INTO brand_filter_id FROM category_filters WHERE slug = 'brand' LIMIT 1;
    
    -- Assign filters to Pillows category
    IF pillows_category_id IS NOT NULL THEN
        INSERT INTO category_filter_assignments (category_id, filter_id, is_required) VALUES
        (pillows_category_id, size_filter_id, true),
        (pillows_category_id, color_filter_id, true),
        (pillows_category_id, material_filter_id, true),
        (pillows_category_id, pattern_filter_id, false),
        (pillows_category_id, brand_filter_id, false)
        ON CONFLICT (category_id, filter_id) DO NOTHING;
        
        RAISE NOTICE 'Assigned filters to Pillows category';
    ELSE
        RAISE NOTICE 'Pillows category not found';
    END IF;
    
    -- Assign filters to Sheets category
    IF sheets_category_id IS NOT NULL THEN
        INSERT INTO category_filter_assignments (category_id, filter_id, is_required) VALUES
        (sheets_category_id, size_filter_id, true),
        (sheets_category_id, color_filter_id, true),
        (sheets_category_id, material_filter_id, true),
        (sheets_category_id, pattern_filter_id, false),
        (sheets_category_id, brand_filter_id, false)
        ON CONFLICT (category_id, filter_id) DO NOTHING;
        
        RAISE NOTICE 'Assigned filters to Sheets category';
    ELSE
        RAISE NOTICE 'Sheets category not found';
    END IF;
    
    -- Assign filters to Bedding category
    IF bedding_category_id IS NOT NULL THEN
        INSERT INTO category_filter_assignments (category_id, filter_id, is_required) VALUES
        (bedding_category_id, size_filter_id, true),
        (bedding_category_id, color_filter_id, true),
        (bedding_category_id, material_filter_id, true),
        (bedding_category_id, pattern_filter_id, false),
        (bedding_category_id, brand_filter_id, false)
        ON CONFLICT (category_id, filter_id) DO NOTHING;
        
        RAISE NOTICE 'Assigned filters to Bedding category';
    ELSE
        RAISE NOTICE 'Bedding category not found';
    END IF;
    
    -- Assign filters to Blankets category
    IF blankets_category_id IS NOT NULL THEN
        INSERT INTO category_filter_assignments (category_id, filter_id, is_required) VALUES
        (blankets_category_id, size_filter_id, true),
        (blankets_category_id, color_filter_id, true),
        (blankets_category_id, material_filter_id, true),
        (blankets_category_id, pattern_filter_id, false),
        (blankets_category_id, brand_filter_id, false)
        ON CONFLICT (category_id, filter_id) DO NOTHING;
        
        RAISE NOTICE 'Assigned filters to Blankets category';
    ELSE
        RAISE NOTICE 'Blankets category not found';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Filter assignment completed!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Assigned filters:';
    RAISE NOTICE '   • Size (required)';
    RAISE NOTICE '   • Color (required)';
    RAISE NOTICE '   • Material (required)';
    RAISE NOTICE '   • Pattern (optional)';
    RAISE NOTICE '   • Brand (optional)';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Please refresh your browser and try creating a product again.';
    RAISE NOTICE '   You should now see filter options when you select a category!';
    
END $$; 