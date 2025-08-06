-- Sample products for Bedz & Buttunz
-- Beautiful Egyptian cotton bedding products

INSERT INTO products (
  title, description, price, compare_at_price, images, category, tags, 
  inventory_quantity, low_stock_threshold, status, sku, handle, weight
) VALUES 
(
  'Cairo Nights Duvet Set',
  'Luxurious Egyptian cotton duvet set featuring deep purple and gold accents. Includes duvet cover, fitted sheet, and 2 pillowcases. Thread count: 400. Perfect for queen-size beds.',
  45000,
  55000,
  '["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80"]',
  'bedding',
  '["egyptian cotton", "duvet set", "luxury", "purple", "queen"]',
  25,
  5,
  'active',
  'CNS-001',
  'cairo-nights-duvet-set',
  2.5
),
(
  'Sahara Sunrise Bed Sheets',
  'Premium Egyptian cotton bed sheets in warm golden tones. Ultra-soft 500 thread count percale weave. Set includes fitted sheet, flat sheet, and 2 pillowcases.',
  35000,
  NULL,
  '["https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80"]',
  'sheets',
  '["egyptian cotton", "bed sheets", "golden", "percale", "500 thread count"]',
  30,
  5,
  'active',
  'SSS-002',
  'sahara-sunrise-bed-sheets',
  1.8
),
(
  'Alexandria Memory Foam Pillow',
  'Ergonomic memory foam pillow with Egyptian cotton cover. Provides optimal neck support while maintaining the luxurious feel of authentic Egyptian cotton.',
  15000,
  18000,
  '["https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80"]',
  'pillows',
  '["memory foam", "egyptian cotton", "ergonomic", "neck support"]',
  50,
  10,
  'active',
  'AMP-003',
  'alexandria-memory-foam-pillow',
  1.2
),
(
  'Nile Valley Comforter',
  'All-season down alternative comforter wrapped in silky Egyptian cotton. Hypoallergenic filling perfect for year-round comfort. Available in king and queen sizes.',
  40000,
  NULL,
  '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"]',
  'duvets',
  '["comforter", "down alternative", "hypoallergenic", "all-season"]',
  20,
  5,
  'active',
  'NVC-004',
  'nile-valley-comforter',
  3.0
),
(
  'Pharaoh''s Dream Pillowcase Set',
  'Set of 2 premium Egyptian cotton pillowcases with envelope closure. 600 thread count sateen weave for ultimate smoothness. Available in multiple colors.',
  12000,
  15000,
  '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]',
  'accessories',
  '["pillowcases", "sateen", "600 thread count", "envelope closure"]',
  40,
  8,
  'active',
  'PDS-005',
  'pharaoh-dream-pillowcase-set',
  0.4
),
(
  'Royal Egyptian Cotton Throw',
  'Elegant throw blanket made from 100% Egyptian cotton. Perfect for adding a touch of luxury to your bedroom or living room. Dimensions: 150cm x 200cm.',
  25000,
  NULL,
  '["https://images.unsplash.com/photo-1541123603104-512919d6a96c?auto=format&fit=crop&w=800&q=80"]',
  'accessories',
  '["throw blanket", "egyptian cotton", "luxury", "decorative"]',
  35,
  7,
  'active',
  'RET-006',
  'royal-egyptian-cotton-throw',
  1.5
),
(
  'Desert Rose Bedding Bundle',
  'Complete bedding set in beautiful rose gold tones. Includes duvet cover, fitted sheet, flat sheet, 4 pillowcases, and matching throw pillow. King size.',
  75000,
  85000,
  '["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80"]',
  'bedding',
  '["complete set", "rose gold", "king size", "bundle", "luxury"]',
  15,
  3,
  'active',
  'DRB-007',
  'desert-rose-bedding-bundle',
  4.2
),
(
  'Cleopatra Silk-Touch Sheets',
  'Egyptian cotton sheets with silk-like finish. 800 thread count bamboo-Egyptian cotton blend for ultimate softness and breathability.',
  50000,
  NULL,
  '["https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80"]',
  'sheets',
  '["silk-touch", "800 thread count", "bamboo blend", "breathable"]',
  22,
  5,
  'active',
  'CSS-008',
  'cleopatra-silk-touch-sheets',
  2.0
);

-- Add some product variants for sizes and colors
INSERT INTO product_variants (
  product_id, title, price, compare_at_price, sku, inventory_quantity, 
  option1, option2, option3, weight, requires_shipping
) VALUES 
-- Cairo Nights Duvet Set variants
((SELECT id FROM products WHERE sku = 'CNS-001'), 'Queen / Purple', 45000, 55000, 'CNS-001-Q-PUR', 25, 'Queen', 'Purple', NULL, 2.5, true),
((SELECT id FROM products WHERE sku = 'CNS-001'), 'King / Purple', 50000, 60000, 'CNS-001-K-PUR', 20, 'King', 'Purple', NULL, 3.0, true),
((SELECT id FROM products WHERE sku = 'CNS-001'), 'Queen / Gold', 45000, 55000, 'CNS-001-Q-GLD', 22, 'Queen', 'Gold', NULL, 2.5, true),

-- Sahara Sunrise Bed Sheets variants
((SELECT id FROM products WHERE sku = 'SSS-002'), 'Queen / Golden', 35000, NULL, 'SSS-002-Q-GLD', 30, 'Queen', 'Golden', NULL, 1.8, true),
((SELECT id FROM products WHERE sku = 'SSS-002'), 'King / Golden', 40000, NULL, 'SSS-002-K-GLD', 25, 'King', 'Golden', NULL, 2.2, true),

-- Alexandria Memory Foam Pillow variants
((SELECT id FROM products WHERE sku = 'AMP-003'), 'Standard / White', 15000, 18000, 'AMP-003-STD-WHT', 50, 'Standard', 'White', NULL, 1.2, true),
((SELECT id FROM products WHERE sku = 'AMP-003'), 'King / White', 18000, 22000, 'AMP-003-K-WHT', 30, 'King', 'White', NULL, 1.5, true);

-- Update product images with more variety
UPDATE products SET images = '["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"]' WHERE sku = 'CNS-001';
UPDATE products SET images = '["https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80"]' WHERE sku = 'SSS-002';
UPDATE products SET images = '["https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80"]' WHERE sku = 'AMP-003';
UPDATE products SET images = '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"]' WHERE sku = 'NVC-004';
UPDATE products SET images = '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]' WHERE sku = 'PDS-005';
UPDATE products SET images = '["https://images.unsplash.com/photo-1541123603104-512919d6a96c?auto=format&fit=crop&w=800&q=80"]' WHERE sku = 'RET-006';
UPDATE products SET images = '["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80"]' WHERE sku = 'DRB-007';
UPDATE products SET images = '["https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"]' WHERE sku = 'CSS-008'; 