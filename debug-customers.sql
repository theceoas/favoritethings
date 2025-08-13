-- Debug Customers Admin Page Issues
-- Run this in your Supabase SQL editor to diagnose why customers aren't showing up

-- 1. Check if profiles table exists and has data
SELECT '=== PROFILES TABLE CHECK ===' as section;

SELECT 
  'Profiles table exists' as check,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) as result;

SELECT 
  'Total profiles count' as check,
  COUNT(*) as result
FROM profiles;

SELECT 
  'Profiles by role' as check,
  role,
  COUNT(*) as count
FROM profiles 
GROUP BY role;

-- 2. Check RLS policies on profiles table
SELECT '=== RLS POLICIES CHECK ===' as section;

SELECT 
  'RLS enabled on profiles' as check,
  relrowsecurity as result
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public' AND c.relname = 'profiles';

SELECT 
  'Policies on profiles table' as check,
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Check if orders table exists
SELECT '=== ORDERS TABLE CHECK ===' as section;

SELECT 
  'Orders table exists' as check,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) as result;

-- If orders table exists, check its structure
SELECT 
  'Orders table structure' as check,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- 4. Test customer data query (similar to what the admin page does)
SELECT '=== CUSTOMER DATA TEST ===' as section;

-- Test basic profiles query
SELECT 
  'Basic profiles query' as test,
  COUNT(*) as customer_count
FROM profiles 
WHERE role = 'customer';

-- Test with sample customer data
SELECT 
  'Sample customer data' as test,
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE role = 'customer'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check authentication context
SELECT '=== AUTH CONTEXT CHECK ===' as section;

SELECT 
  'Current user context' as check,
  current_user,
  session_user,
  current_setting('role') as current_role;

-- 6. Test admin access
SELECT '=== ADMIN ACCESS TEST ===' as section;

-- Check if current user is admin
SELECT 
  'Current user admin status' as check,
  role as user_role
FROM profiles 
WHERE id = auth.uid();

-- Test admin policy access
SELECT 
  'Admin can see all profiles' as check,
  COUNT(*) as total_profiles
FROM profiles;

-- 7. Recommendations
SELECT '=== RECOMMENDATIONS ===' as section;

-- If no customers found, suggest creating test data
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles WHERE role = 'customer') = 0 
    THEN 'No customers found. Run create-test-customers.sql to add test data.'
    ELSE 'Customers found. Check RLS policies if still not showing in admin.'
  END as recommendation; 