-- Insert sample products for each brand
-- Run this in your Supabase SQL Editor after running insert-brands.sql

-- First, get the brand IDs
DO $$
DECLARE
    kiowa_id UUID;
    omegebyify_id UUID;
    minime_id UUID;
BEGIN
    -- Get brand IDs
    SELECT id INTO kiowa_id FROM brands WHERE slug = 'kiowa';
    SELECT id INTO omegebyify_id FROM brands WHERE slug = 'omegebyify';
    SELECT id INTO minime_id FROM brands WHERE slug = 'minime';

    -- Kiowa Products (Elegant & Sophisticated)
    INSERT INTO products (brand_id, title, slug, description, short_description, sku, price, compare_at_price, inventory_quantity, low_stock_threshold, is_active, is_featured, track_inventory, seo_title, seo_description) VALUES
    (kiowa_id, 'Kiowa Luxury Egyptian Cotton Bedding Set', 'kiowa-luxury-egyptian-cotton-bedding-set', 'Premium 1000 thread count Egyptian cotton bedding set with elegant embroidery. Perfect for creating a sophisticated bedroom atmosphere.', 'Luxury bedding with elegant embroidery', 'KIOWA-BED-001', 299.99, 399.99, 25, 5, true, true, true, 'Kiowa Luxury Egyptian Cotton Bedding Set', 'Premium 1000 thread count Egyptian cotton bedding set with elegant embroidery for sophisticated bedrooms.'),
    (kiowa_id, 'Kiowa Silk Pillowcases - Set of 2', 'kiowa-silk-pillowcases-set-2', 'Pure mulberry silk pillowcases for ultimate comfort and hair protection. Hypoallergenic and temperature regulating.', 'Silk pillowcases for hair protection', 'KIOWA-PIL-001', 89.99, 119.99, 50, 10, true, true, true, 'Kiowa Silk Pillowcases Set', 'Pure mulberry silk pillowcases for ultimate comfort and hair protection. Hypoallergenic and temperature regulating.'),
    (kiowa_id, 'Kiowa Velvet Throw Pillows', 'kiowa-velvet-throw-pillows', 'Luxurious velvet throw pillows with gold accents. Perfect for adding elegance to any room.', 'Velvet pillows with gold accents', 'KIOWA-PIL-002', 45.99, 59.99, 30, 5, true, false, true, 'Kiowa Velvet Throw Pillows', 'Luxurious velvet throw pillows with gold accents for elegant home decor.'),
    (kiowa_id, 'Kiowa Linen Duvet Cover', 'kiowa-linen-duvet-cover', 'Premium Belgian linen duvet cover with natural texture and breathable comfort.', 'Belgian linen duvet cover', 'KIOWA-DUV-001', 199.99, 249.99, 20, 5, true, true, true, 'Kiowa Linen Duvet Cover', 'Premium Belgian linen duvet cover with natural texture and breathable comfort.'),
    (kiowa_id, 'Kiowa Embroidered Table Runner', 'kiowa-embroidered-table-runner', 'Hand-embroidered table runner with intricate floral patterns. Perfect for elegant dining.', 'Hand-embroidered table runner', 'KIOWA-TAB-001', 79.99, 99.99, 15, 3, true, false, true, 'Kiowa Embroidered Table Runner', 'Hand-embroidered table runner with intricate floral patterns for elegant dining.');

    -- OmegeByIfy Products (Bold & Contemporary)
    INSERT INTO products (brand_id, title, slug, description, short_description, sku, price, compare_at_price, inventory_quantity, low_stock_threshold, is_active, is_featured, track_inventory, seo_title, seo_description) VALUES
    (omegebyify_id, 'OmegeByIfy Bold Geometric Bedding', 'omegebyify-bold-geometric-bedding', 'Contemporary geometric pattern bedding with bold colors and modern design. Perfect for statement bedrooms.', 'Bold geometric pattern bedding', 'OMEGE-BED-001', 189.99, 249.99, 30, 8, true, true, true, 'OmegeByIfy Bold Geometric Bedding', 'Contemporary geometric pattern bedding with bold colors and modern design for statement bedrooms.'),
    (omegebyify_id, 'OmegeByIfy Abstract Art Pillows', 'omegebyify-abstract-art-pillows', 'Abstract art-inspired throw pillows with vibrant colors and contemporary patterns.', 'Abstract art throw pillows', 'OMEGE-PIL-001', 65.99, 85.99, 40, 10, true, true, true, 'OmegeByIfy Abstract Art Pillows', 'Abstract art-inspired throw pillows with vibrant colors and contemporary patterns.'),
    (omegebyify_id, 'OmegeByIfy Modern Wall Art', 'omegebyify-modern-wall-art', 'Contemporary wall art with bold strokes and vibrant colors. Perfect for modern interiors.', 'Contemporary wall art', 'OMEGE-ART-001', 299.99, 399.99, 10, 2, true, false, true, 'OmegeByIfy Modern Wall Art', 'Contemporary wall art with bold strokes and vibrant colors for modern interiors.'),
    (omegebyify_id, 'OmegeByIfy Color Block Curtains', 'omegebyify-color-block-curtains', 'Bold color block curtains with contemporary design and premium fabric.', 'Color block curtains', 'OMEGE-CUR-001', 159.99, 199.99, 25, 5, true, true, true, 'OmegeByIfy Color Block Curtains', 'Bold color block curtains with contemporary design and premium fabric.'),
    (omegebyify_id, 'OmegeByIfy Statement Rug', 'omegebyify-statement-rug', 'Large statement rug with bold patterns and contemporary colors. Perfect for anchoring a room.', 'Statement rug with bold patterns', 'OMEGE-RUG-001', 449.99, 599.99, 8, 2, true, false, true, 'OmegeByIfy Statement Rug', 'Large statement rug with bold patterns and contemporary colors for anchoring modern rooms.');

    -- MiniMe Products (Playful & Vibrant)
    INSERT INTO products (brand_id, title, slug, description, short_description, sku, price, compare_at_price, inventory_quantity, low_stock_threshold, is_active, is_featured, track_inventory, seo_title, seo_description) VALUES
    (minime_id, 'MiniMe Fun Pattern Bedding', 'minime-fun-pattern-bedding', 'Playful bedding with fun patterns and bright colors. Perfect for kids rooms or playful adults.', 'Fun pattern bedding for kids', 'MINI-BED-001', 129.99, 169.99, 35, 8, true, true, true, 'MiniMe Fun Pattern Bedding', 'Playful bedding with fun patterns and bright colors perfect for kids rooms or playful adults.'),
    (minime_id, 'MiniMe Colorful Throw Pillows', 'minime-colorful-throw-pillows', 'Bright and colorful throw pillows with fun designs and soft textures.', 'Colorful throw pillows', 'MINI-PIL-001', 39.99, 49.99, 50, 10, true, true, true, 'MiniMe Colorful Throw Pillows', 'Bright and colorful throw pillows with fun designs and soft textures.'),
    (minime_id, 'MiniMe Playful Wall Decals', 'minime-playful-wall-decals', 'Removable wall decals with fun designs and bright colors. Perfect for kids rooms.', 'Fun wall decals for kids', 'MINI-DEC-001', 29.99, 39.99, 60, 15, true, false, true, 'MiniMe Playful Wall Decals', 'Removable wall decals with fun designs and bright colors perfect for kids rooms.'),
    (minime_id, 'MiniMe Bright Tableware Set', 'minime-bright-tableware-set', 'Colorful tableware set with fun patterns. Perfect for making mealtime more enjoyable.', 'Bright tableware set', 'MINI-TAB-001', 89.99, 119.99, 20, 5, true, true, true, 'MiniMe Bright Tableware Set', 'Colorful tableware set with fun patterns perfect for making mealtime more enjoyable.'),
    (minime_id, 'MiniMe Fun Storage Baskets', 'minime-fun-storage-baskets', 'Colorful storage baskets with fun designs. Perfect for organizing kids rooms.', 'Fun storage baskets', 'MINI-STR-001', 49.99, 69.99, 30, 8, true, false, true, 'MiniMe Fun Storage Baskets', 'Colorful storage baskets with fun designs perfect for organizing kids rooms.');

END $$;

-- Verify the products were inserted
SELECT 
    b.name as brand_name,
    p.title,
    p.price,
    p.is_featured,
    p.inventory_quantity
FROM products p
JOIN brands b ON p.brand_id = b.id
ORDER BY b.sort_order, p.created_at DESC; 