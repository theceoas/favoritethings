-- Simple RLS Fix: Disable RLS and Check Existing Data
-- Run this in your Supabase SQL Editor

-- 1. Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as section;
SELECT 
  'RLS enabled on profiles' as check,
  relrowsecurity as result
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public' AND c.relname = 'profiles';

-- 2. Check what columns exist in profiles table
SELECT '=== PROFILES TABLE STRUCTURE ===' as section;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Temporarily disable RLS on profiles table
SELECT '=== DISABLING RLS ===' as section;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS DISABLED - Admin should now be able to see all customers' as status;

-- 4. Test access to existing data
SELECT '=== TESTING ACCESS ===' as section;
SELECT 
  'Total profiles' as check,
  COUNT(*) as count
FROM profiles;

SELECT 
  'Customer profiles' as check,
  COUNT(*) as count
FROM profiles 
WHERE role = 'customer';

-- 5. Show all existing profiles
SELECT '=== ALL EXISTING PROFILES ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 6. Show customer profiles specifically
SELECT '=== CUSTOMER PROFILES ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE role = 'customer'
ORDER BY created_at DESC;

-- 7. Check if there are any auth users without profiles
SELECT '=== AUTH USERS WITHOUT PROFILES ===' as section;
SELECT 
  'Auth users without profiles' as check,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 8. Show sample auth users
SELECT '=== SAMPLE AUTH USERS ===' as section;
SELECT 
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 9. Final verification
SELECT '=== FINAL VERIFICATION ===' as section;
SELECT 
  'Can access profiles table' as check,
  COUNT(*) as total_profiles
FROM profiles;

SELECT 
  'Can access customer profiles' as check,
  COUNT(*) as customer_count
FROM profiles 
WHERE role = 'customer'; 