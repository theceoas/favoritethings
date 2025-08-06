-- Debug: Check Collections Data
-- Run this in your Supabase SQL Editor to verify your collections

-- 1. Check if collections table exists and has data
SELECT COUNT(*) as total_collections FROM collections;

-- 2. Check all collections with their featured status
SELECT 
  id,
  name,
  slug,
  is_featured,
  is_active,
  sort_order,
  created_at
FROM collections 
ORDER BY sort_order;

-- 3. Check specifically for featured collections (what homepage should show)
SELECT 
  id,
  name,
  slug,
  description,
  image_url,
  is_featured,
  is_active,
  sort_order
FROM collections 
WHERE is_featured = true 
  AND is_active = true
ORDER BY sort_order
LIMIT 3;

-- 4. Check if any collections exist at all
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No collections found - SQL might not have run'
    WHEN COUNT(*) > 0 AND SUM(CASE WHEN is_featured = true THEN 1 ELSE 0 END) = 0 THEN '⚠️ Collections exist but none are featured'
    WHEN COUNT(*) > 0 AND SUM(CASE WHEN is_featured = true THEN 1 ELSE 0 END) > 0 THEN '✅ Featured collections exist'
    ELSE 'Unknown status'
  END as status,
  COUNT(*) as total,
  SUM(CASE WHEN is_featured = true THEN 1 ELSE 0 END) as featured_count
FROM collections;

-- Debug Collections Table and Permissions
-- Run this in your Supabase SQL editor to check for issues

-- 1. Check current collections and their featured status
SELECT 
    id, 
    name, 
    is_featured, 
    is_active,
    created_at,
    updated_at
FROM collections 
ORDER BY created_at DESC;

-- 2. Check RLS policies on collections table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'collections';

-- 3. Check if RLS is enabled on collections table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'collections';

-- 4. Test update permissions (run this to test if update works manually)
-- UPDATE collections 
-- SET is_featured = NOT is_featured, updated_at = NOW()
-- WHERE id = 'your-collection-id-here'
-- RETURNING id, name, is_featured;

-- 5. Check if there are any triggers or constraints
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'collections'; 