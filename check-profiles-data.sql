-- Check what customer data exists in the profiles table
-- Run this in your Supabase SQL editor

-- 1. Check total profiles count
SELECT '=== TOTAL PROFILES ===' as section;
SELECT 
  'Total profiles' as check,
  COUNT(*) as count
FROM profiles;

-- 2. Check profiles by role
SELECT '=== PROFILES BY ROLE ===' as section;
SELECT 
  role,
  COUNT(*) as count
FROM profiles 
GROUP BY role;

-- 3. Check customer profiles specifically
SELECT '=== CUSTOMER PROFILES ===' as section;
SELECT 
  'Customer profiles' as check,
  COUNT(*) as count
FROM profiles 
WHERE role = 'customer';

-- 4. Show sample customer data
SELECT '=== SAMPLE CUSTOMER DATA ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  created_at,
  is_active
FROM profiles 
WHERE role = 'customer'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if there are any profiles at all
SELECT '=== ALL PROFILES SAMPLE ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check RLS policies on profiles table
SELECT '=== RLS POLICIES ===' as section;
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'profiles';

-- 7. Test if we can query profiles as current user
SELECT '=== CURRENT USER ACCESS ===' as section;
SELECT 
  'Can access profiles' as check,
  COUNT(*) as count
FROM profiles; 