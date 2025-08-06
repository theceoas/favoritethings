-- Insert test products for cart and order testing

INSERT INTO products (
  title,
  slug,
  description,
  short_description,
  sku,
  price,
  compare_at_price,
  cost_price,
  track_inventory,
  inventory_quantity,
  low_stock_threshold,
  weight,
  dimensions,
  material,
  care_instructions,
  images,
  featured_image,
  seo_title,
  seo_description,
  is_active,
  is_featured
) VALUES 
(
  'Egyptian Cotton Duvet Cover Set',
  'egyptian-cotton-duvet-cover-set',
  'Experience luxury sleep with our premium Egyptian cotton duvet cover set. Made from the finest long-staple cotton fibers, this set offers unparalleled softness and durability. The breathable fabric ensures comfortable sleep year-round.',
  'Premium Egyptian cotton duvet cover set with pillowcases',
  'BZ-DUV-001',
  45000,
  55000,
  28000,
  true,
  25,
  5,
  1.2,
  '220cm x 240cm',
  '100% Egyptian Cotton',
  'Machine wash at 40°C, tumble dry low, iron on medium heat',
  ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'],
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
  'Egyptian Cotton Duvet Cover Set - Premium Bedding | Bedz&Buttunz',
  'Luxury Egyptian cotton duvet cover set for the ultimate sleep experience',
  true,
  true
),
(
  'Memory Foam Pillow Set',
  'memory-foam-pillow-set',
  'Transform your sleep with our ergonomic memory foam pillow set. Designed to provide optimal neck and spine alignment, these pillows adapt to your unique sleep position for personalized comfort.',
  'Ergonomic memory foam pillows for better sleep',
  'BZ-PIL-002',
  28000,
  35000,
  18000,
  true,
  40,
  8,
  0.8,
  '60cm x 40cm x 12cm',
  'Memory Foam with Bamboo Cover',
  'Remove cover and machine wash, spot clean foam core only',
  ARRAY['https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800'],
  'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800',
  'Memory Foam Pillow Set - Ergonomic Support | Bedz&Buttunz',
  'Premium memory foam pillows for optimal sleep comfort and support',
  true,
  false
),
(
  'Luxury Silk Pillowcase Set',
  'luxury-silk-pillowcase-set',
  'Indulge in the beauty benefits of 100% pure mulberry silk pillowcases. Naturally hypoallergenic and temperature-regulating, these pillowcases help maintain your skin and hair health while you sleep.',
  '100% mulberry silk pillowcases for beauty sleep',
  'BZ-SIL-003',
  32000,
  40000,
  20000,
  true,
  30,
  6,
  0.3,
  '50cm x 75cm',
  '100% Mulberry Silk',
  'Hand wash or gentle machine wash in cold water, air dry',
  ARRAY['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
  'Luxury Silk Pillowcase Set - Beauty Sleep | Bedz&Buttunz',
  'Pure mulberry silk pillowcases for healthy skin and hair',
  true,
  true
),
(
  'Weighted Blanket - Premium',
  'weighted-blanket-premium',
  'Experience the calming benefits of our premium weighted blanket. Scientifically designed to provide gentle, even pressure that promotes relaxation and better sleep quality.',
  'Premium weighted blanket for better sleep',
  'BZ-WBL-004',
  55000,
  68000,
  35000,
  true,
  15,
  3,
  7.0,
  '150cm x 200cm',
  'Cotton outer, Glass bead filling',
  'Machine wash gentle cycle, air dry recommended',
  ARRAY['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'],
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
  'Premium Weighted Blanket - Anxiety Relief | Bedz&Buttunz',
  'Premium weighted blanket for relaxation and better sleep quality',
  true,
  false
),
(
  'Organic Cotton Sheet Set',
  'organic-cotton-sheet-set',
  'Sleep sustainably with our certified organic cotton sheet set. Grown without harmful chemicals and processed with eco-friendly methods, these sheets are gentle on your skin and the environment.',
  'Certified organic cotton bed sheets',
  'BZ-ORG-005',
  38000,
  45000,
  24000,
  true,
  35,
  7,
  1.5,
  'Queen Size - Fitted, Flat, 2 Pillowcases',
  '100% Certified Organic Cotton',
  'Machine wash warm, tumble dry medium, iron if needed',
  ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'],
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  'Organic Cotton Sheet Set - Eco-Friendly Bedding | Bedz&Buttunz',
  'Certified organic cotton sheets for sustainable, comfortable sleep',
  true,
  true
);

-- Add products to categories
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id 
FROM products p, categories c 
WHERE p.slug = 'egyptian-cotton-duvet-cover-set' AND c.slug = 'bedding';

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id 
FROM products p, categories c 
WHERE p.slug = 'memory-foam-pillow-set' AND c.slug = 'pillows';

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id 
FROM products p, categories c 
WHERE p.slug = 'luxury-silk-pillowcase-set' AND c.slug = 'pillows';

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id 
FROM products p, categories c 
WHERE p.slug = 'weighted-blanket-premium' AND c.slug = 'blankets';

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id 
FROM products p, categories c 
WHERE p.slug = 'organic-cotton-sheet-set' AND c.slug = 'sheets'; 