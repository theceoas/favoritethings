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
    WHEN slug = 'omegebyify' THEN 'Bold and contemporary fashion'
    WHEN slug = 'minime' THEN 'Playful and vibrant fashion'
    ELSE description
  END,
  preview_image_url = CASE 
    WHEN slug = 'kiowa' THEN '/placeholder.svg?height=300&width=250&text=Kiowa+Preview'
    WHEN slug = 'omegebyify' THEN '/placeholder.svg?height=300&width=250&text=Omogebyify+Preview'
    WHEN slug = 'minime' THEN '/placeholder.svg?height=300&width=250&text=MiniMe+Preview'
    ELSE '/placeholder.svg?height=300&width=250&text=' || name || '+Preview'
  END
WHERE preview_title IS NULL; 