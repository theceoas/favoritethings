-- Add preview fields to brands table for home page preview management
ALTER TABLE brands ADD COLUMN IF NOT EXISTS preview_image_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS preview_title TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS preview_description TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT TRUE;

-- Update existing brands with default preview content
UPDATE brands 
SET 
  preview_title = name,
  preview_description = CASE 
    WHEN slug = 'kiowa' THEN 'Elegant sophistication with timeless pieces'
    WHEN slug = 'omegebyify' THEN 'Bold and contemporary fashion that pushes boundaries and celebrates individuality. Modern designs with striking aesthetics.'
    WHEN slug = 'minime' THEN 'Playful and vibrant fashion'
    ELSE description
  END,
  preview_image_url = CASE 
    WHEN slug = 'kiowa' THEN 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80'
    WHEN slug = 'omegebyify' THEN 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80'
    WHEN slug = 'minime' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
    ELSE 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
  END
WHERE preview_title IS NULL; 