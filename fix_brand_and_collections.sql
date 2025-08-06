-- Fix Brand Slug and Set Up Collections System
-- Run this in your Supabase SQL Editor

-- 1. Update the brand slug from "omegebyify" to "omogebyify"
UPDATE brands 
SET slug = 'omogebyify', 
    name = 'Omogebyify',
    updated_at = NOW()
WHERE slug = 'omegebyify';

-- 2. Create collections table if it doesn't exist
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create product_collections junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, collection_id)
);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_featured ON collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON collections(is_active);
CREATE INDEX IF NOT EXISTS idx_product_collections_product_id ON product_collections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_collections_collection_id ON product_collections(collection_id);

-- 5. Enable RLS on collections table
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for collections
DROP POLICY IF EXISTS "Allow public read access to collections" ON collections;
CREATE POLICY "Allow public read access to collections" ON collections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage collections" ON collections;
CREATE POLICY "Allow authenticated users to manage collections" ON collections
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Enable RLS on product_collections table
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for product_collections
DROP POLICY IF EXISTS "Allow public read access to product_collections" ON product_collections;
CREATE POLICY "Allow public read access to product_collections" ON product_collections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage product_collections" ON product_collections;
CREATE POLICY "Allow authenticated users to manage product_collections" ON product_collections
    FOR ALL USING (auth.role() = 'authenticated');

-- 9. Create trigger for updated_at on collections
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_collections_updated_at_trigger ON collections;
CREATE TRIGGER update_collections_updated_at_trigger
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_collections_updated_at();

-- 10. Insert sample collections for each brand
INSERT INTO collections (name, slug, description, image_url, is_featured, is_active, sort_order) VALUES
-- Kiowa Collections
('Elegant Essentials', 'kiowa-elegant-essentials', 'Timeless pieces that embody grace and sophistication. Premium materials with exquisite craftsmanship.', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80', true, true, 1),
('Luxury Bedding', 'kiowa-luxury-bedding', 'Premium Egyptian cotton with thread counts of 800+ for the ultimate sleeping experience.', 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=800&q=80', true, true, 2),
('Nigerian Heritage', 'kiowa-nigerian-heritage', 'Celebrate Nigerian culture with traditional patterns and vibrant colors inspired by Nigerian textile art.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80', false, true, 3),

-- Omogebyify Collections
('Bold & Contemporary', 'omogebyify-bold-contemporary', 'Modern designs that push boundaries and celebrate individuality with striking aesthetics.', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80', true, true, 4),
('Urban Streetwear', 'omogebyify-urban-streetwear', 'Contemporary streetwear and urban fashion for the modern trendsetter.', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', true, true, 5),
('Minimalist Modern', 'omogebyify-minimalist-modern', 'Clean lines and neutral tones define our minimalist collection for contemporary homes.', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80', false, true, 6),

-- MiniMe Collections
('Fun & Playful', 'minime-fun-playful', 'Vibrant designs for the young at heart with playful patterns and bright colors.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80', true, true, 7),
('Bright & Bold', 'minime-bright-bold', 'Colorful pieces that spark joy and creativity for children and young adults.', 'https://images.unsplash.com/photo-1631679706909-fdd1c3833f78?auto=format&fit=crop&w=800&q=80', true, true, 8),
('Modern Comfort', 'minime-modern-comfort', 'Cozy designs with contemporary flair perfect for modern comfort.', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', false, true, 9)
ON CONFLICT (slug) DO NOTHING;

-- 11. Verify the changes
SELECT 'Brand Update:' as info, name, slug FROM brands WHERE slug = 'omogebyify';
SELECT 'Collections Count:' as info, COUNT(*) as total FROM collections;
SELECT 'Featured Collections:' as info, COUNT(*) as total FROM collections WHERE is_featured = true;

-- 12. Show all collections with their status
SELECT 
    name,
    slug,
    is_featured,
    is_active,
    sort_order
FROM collections 
ORDER BY sort_order; 