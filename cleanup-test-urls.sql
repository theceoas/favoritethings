-- Clean up test URLs and invalid image URLs from products table

-- Update featured_image field - set to NULL if it contains test URLs
UPDATE products 
SET featured_image = NULL 
WHERE featured_image IS NOT NULL 
  AND (
    featured_image LIKE '%testurl%' 
    OR featured_image LIKE '%test.image%'
    OR featured_image LIKE '%example.com%'
    OR featured_image LIKE '%placeholder%'
    OR featured_image = ''
    OR featured_image NOT LIKE 'http%'
  );

-- Update images field - remove test URLs from the array
UPDATE products 
SET images = (
  SELECT array_agg(img) 
  FROM unnest(images) AS img 
  WHERE img IS NOT NULL 
    AND img NOT LIKE '%testurl%' 
    AND img NOT LIKE '%test.image%'
    AND img NOT LIKE '%example.com%'
    AND img NOT LIKE '%placeholder%'
    AND img != ''
    AND img LIKE 'http%'
)
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0;

-- Set empty image arrays to NULL
UPDATE products 
SET images = NULL 
WHERE images IS NOT NULL 
  AND (array_length(images, 1) IS NULL OR array_length(images, 1) = 0);

-- Display products that still have image issues
SELECT 
  id, 
  title, 
  featured_image, 
  images,
  CASE 
    WHEN featured_image IS NULL AND (images IS NULL OR array_length(images, 1) IS NULL) 
    THEN 'No images'
    ELSE 'Has images'
  END as image_status
FROM products 
ORDER BY created_at DESC; 