-- Create brands table
CREATE TABLE brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add brand_id to products table
ALTER TABLE products ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_is_active ON brands(is_active);
CREATE INDEX idx_products_brand_id ON products(brand_id);

-- Enable RLS on brands table
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brands
CREATE POLICY "Allow public read access to brands" ON brands
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert brands" ON brands
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update brands" ON brands
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete brands" ON brands
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some default brands
INSERT INTO brands (name, slug, description, primary_color, secondary_color, accent_color, sort_order) VALUES
('Kiowa', 'kiowa', 'Premium fashion brand for modern women', '#6A41A1', '#4F4032', '#E8D5C4', 1),
('MiniMe', 'minime', 'Trendy fashion for the young and bold', '#FF6B6B', '#4ECDC4', '#45B7D1', 2),
('OmegeByIfy', 'omegebyify', 'Elegant and sophisticated fashion', '#2C3E50', '#E74C3C', '#F39C12', 3)
ON CONFLICT (slug) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 