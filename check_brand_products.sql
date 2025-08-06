-- Check which products are associated with the old brand
SELECT 
    p.id,
    p.title,
    p.sku,
    b.name as brand_name,
    b.slug as brand_slug
FROM products p
JOIN brands b ON p.brand_id = b.id
WHERE b.slug = 'omogebyify';

-- Check if there are any products that need to be associated with the updated brand
SELECT 
    p.id,
    p.title,
    p.sku,
    b.name as brand_name,
    b.slug as brand_slug
FROM products p
JOIN brands b ON p.brand_id = b.id
WHERE b.slug IN ('omegebyify', 'omogebyify'); 