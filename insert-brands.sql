-- Insert the 3 brands for Favorite Things multi-brand structure
-- Run this in your Supabase SQL Editor

INSERT INTO brands (name, slug, description, primary_color, secondary_color, is_active, sort_order) 
VALUES 
  (
    'Kiowa', 
    'kiowa', 
    'Elegant sophistication with timeless pieces that embody grace and refinement. Each garment tells a story of craftsmanship and attention to detail.',
    '#F59E0B', -- Yellow/Amber primary
    '#EA580C', -- Orange secondary  
    true,
    1
  ),
  (
    'OmegeByIfy', 
    'omegebyify', 
    'Bold and contemporary fashion that pushes boundaries and celebrates individuality. Modern designs with striking aesthetics.',
    '#DC2626', -- Red primary
    '#F59E0B', -- Yellow secondary
    true,
    2
  ),
  (
    'MiniMe', 
    'minime', 
    'Playful and vibrant fashion for the young at heart. Fun designs with bright colors and modern comfort.',
    '#10B981', -- Green primary
    '#F59E0B', -- Yellow secondary
    true,
    3
  );

-- Verify the brands were inserted
SELECT * FROM brands ORDER BY sort_order; 