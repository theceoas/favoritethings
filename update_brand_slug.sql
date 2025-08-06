-- Update the brand slug from "omegebyify" to "omogebyify"
UPDATE brands 
SET slug = 'omogebyify', 
    name = 'Omogebyify',
    updated_at = NOW()
WHERE slug = 'omegebyify';

-- Verify the update
SELECT * FROM brands WHERE slug = 'omogebyify'; 