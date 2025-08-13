-- Fix Brand Preview Images
-- Update brand preview images to use real Unsplash images instead of placeholder URLs

UPDATE brands 
SET 
  preview_image_url = CASE 
    WHEN slug = 'kiowa' THEN 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80'
    WHEN slug = 'omegebyify' THEN 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80'
    WHEN slug = 'minime' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
    ELSE preview_image_url
  END,
  preview_description = CASE 
    WHEN slug = 'omegebyify' THEN 'Bold and contemporary fashion that pushes boundaries and celebrates individuality. Modern designs with striking aesthetics.'
    ELSE preview_description
  END
WHERE slug IN ('kiowa', 'omegebyify', 'minime');

-- Verify the changes
SELECT 
  name, 
  slug, 
  preview_image_url, 
  preview_description 
FROM brands 
WHERE slug IN ('kiowa', 'omegebyify', 'minime')
ORDER BY sort_order; 