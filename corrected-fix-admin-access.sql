-- Corrected Fix: Disable RLS for Admin Access Testing
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

-- 4. Test access
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

-- 5. Show sample customer data
SELECT '=== SAMPLE CUSTOMER DATA ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE role = 'customer'
ORDER BY created_at DESC
LIMIT 5;

-- 6. Create test customers if none exist (using only existing columns)
SELECT '=== CREATING TEST CUSTOMERS ===' as section;

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'john.doe@example.com',
  'John Doe',
  'customer',
  '+234-801-234-5678',
  now() - interval '5 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'john.doe@example.com');

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'jane.smith@example.com',
  'Jane Smith',
  'customer',
  '+234-802-345-6789',
  now() - interval '15 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'jane.smith@example.com');

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'mike.johnson@example.com',
  'Mike Johnson',
  'customer',
  '+234-803-456-7890',
  now() - interval '30 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'mike.johnson@example.com');

-- 7. Final verification
SELECT '=== FINAL VERIFICATION ===' as section;
SELECT 
  'Total customer profiles' as check,
  COUNT(*) as count
FROM profiles 
WHERE role = 'customer';

SELECT 
  'Sample customers after fix' as check,
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE role = 'customer'
ORDER BY created_at DESC
LIMIT 3;

-- 8. Show all profiles for debugging
SELECT '=== ALL PROFILES FOR DEBUGGING ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10; 