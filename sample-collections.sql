-- Sample Collections for Bedz&Buttunz
-- Insert sample collections to test the functionality

INSERT INTO collections (name, slug, description, image_url, is_featured, is_active, sort_order) VALUES
-- Featured Collections (these will show on homepage - ONLY 3 will appear)
('Cairo Nights Collection', 'cairo-nights', 'Experience the elegance of Egyptian cotton with our signature duvet sets. Includes 2 pillowcases and a fitted sheet made from premium Egyptian cotton for ultimate comfort.', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80', true, true, 1),

('Royal Comfort Bundle', 'royal-comfort', 'Complete your bedroom with our luxury bundle: duvet, sheets, pillowcases, and decorative throw pillows. Transform your space into a royal retreat with this comprehensive collection.', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80', true, true, 2),

('Accent Essentials', 'accent-essentials', 'Add a touch of style with our accent pillows and throws, perfect for any modern home. Mix and match colors and patterns to create your unique aesthetic.', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', true, true, 3),

-- Additional Collections (not featured - will only show on /collections page)
('Luxury Bedding', 'luxury-bedding', 'Our premium luxury bedding collection featuring the finest Egyptian cotton with thread counts of 800+ for the ultimate sleeping experience.', 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=800&q=80', false, true, 4),

('Nigerian Heritage', 'nigerian-heritage', 'Celebrate Nigerian culture with our heritage collection featuring traditional patterns and vibrant colors inspired by Nigerian textile art.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80', false, true, 5),

('Kids Collection', 'kids-collection', 'Fun and colorful bedding designed specifically for children. Safe, comfortable, and easy to clean with playful patterns that kids love.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80', false, true, 6),

('Minimalist Modern', 'minimalist-modern', 'Clean lines and neutral tones define our minimalist collection. Perfect for contemporary homes that value simplicity and elegance.', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80', false, true, 7),

('Seasonal Specials', 'seasonal-specials', 'Limited-time collections featuring seasonal colors and patterns. Updated quarterly to match the changing seasons and trends.', 'https://images.unsplash.com/photo-1631679706909-fdd1c3833f78?auto=format&fit=crop&w=800&q=80', false, true, 8);

-- Note: After running this script, you will have:
-- ✅ Homepage: Shows exactly 3 featured collections + "View All Collections" button
-- ✅ /collections page: Shows all 8 collections
-- ✅ Admin panel: Manage all collections at /admin/collections
-- 
-- To test:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. Visit your homepage - you'll see 3 featured collections
-- 3. Click "View All Collections" to see all 8 collections
-- 4. Go to /admin/collections to manage featured status 