-- Complete Brands and Promotions Schema
-- =====================================

-- 1. Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add brand_id to products (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand_id') THEN
        ALTER TABLE products ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add brand_id to promotions (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'brand_id') THEN
        ALTER TABLE promotions ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create promotion_usage table
CREATE TABLE IF NOT EXISTS promotion_usage (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    promotion_id UUID NOT NULL,
    user_id UUID NOT NULL,
    order_id UUID NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT promotion_usage_pkey PRIMARY KEY (id),
    CONSTRAINT promotion_usage_promotion_id_user_id_order_id_key UNIQUE (promotion_id, user_id, order_id),
    CONSTRAINT promotion_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT promotion_usage_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES promotions (id),
    CONSTRAINT promotion_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_promotions_brand_id ON promotions(brand_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_user ON promotion_usage USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON promotion_usage USING btree (promotion_id);

-- 6. Enable RLS on brands table
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for brands
DROP POLICY IF EXISTS "Allow public read access to brands" ON brands;
CREATE POLICY "Allow public read access to brands" ON brands
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert brands" ON brands;
CREATE POLICY "Allow authenticated users to insert brands" ON brands
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update brands" ON brands;
CREATE POLICY "Allow authenticated users to update brands" ON brands
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete brands" ON brands;
CREATE POLICY "Allow authenticated users to delete brands" ON brands
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Enable RLS on promotion_usage table
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for promotion_usage
DROP POLICY IF EXISTS "Allow public read access to promotion_usage" ON promotion_usage;
CREATE POLICY "Allow public read access to promotion_usage" ON promotion_usage
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert promotion_usage" ON promotion_usage;
CREATE POLICY "Allow authenticated users to insert promotion_usage" ON promotion_usage
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10. Create function to update promotion usage count
CREATE OR REPLACE FUNCTION update_promotion_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the times_used count in promotions table
    UPDATE promotions 
    SET times_used = (
        SELECT COUNT(*) 
        FROM promotion_usage 
        WHERE promotion_id = NEW.promotion_id
    )
    WHERE id = NEW.promotion_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for updating promotion usage count
DROP TRIGGER IF EXISTS update_promotion_usage_count_trigger ON promotion_usage;
CREATE TRIGGER update_promotion_usage_count_trigger
    AFTER INSERT ON promotion_usage 
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_usage_count();

-- 12. Create trigger for updated_at on brands
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at 
    BEFORE UPDATE ON brands 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Insert default brands
INSERT INTO brands (name, slug, description, primary_color, secondary_color, sort_order) VALUES
('Kiowa', 'kiowa', 'Premium fashion brand for modern women', '#6A41A1', '#4F4032', 1),
('MiniMe', 'minime', 'Trendy fashion for the young and bold', '#FF6B6B', '#4ECDC4', 2),
('OmegeByIfy', 'omegebyify', 'Elegant and sophisticated fashion', '#2C3E50', '#E74C3C', 3)
ON CONFLICT (slug) DO NOTHING; 