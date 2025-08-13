-- Temporary Fix: Disable RLS for Admin Access Testing
-- Run this in your Supabase SQL Editor

-- 1. Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as section;
SELECT 
  'RLS enabled on profiles' as check,
  relrowsecurity as result
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public' AND c.relname = 'profiles';

-- 2. Temporarily disable RLS on profiles table
SELECT '=== DISABLING RLS ===' as section;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS DISABLED - Admin should now be able to see all customers' as status;

-- 3. Test access
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

-- 4. Show sample customer data
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

-- 5. Create test customers if none exist
SELECT '=== CREATING TEST CUSTOMERS ===' as section;

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  marketing_consent,
  email_verified,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'john.doe@example.com',
  'John Doe',
  'customer',
  '+234-801-234-5678',
  true,
  true,
  true,
  now() - interval '5 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'john.doe@example.com');

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  marketing_consent,
  email_verified,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'jane.smith@example.com',
  'Jane Smith',
  'customer',
  '+234-802-345-6789',
  true,
  false,
  true,
  now() - interval '15 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'jane.smith@example.com');

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  marketing_consent,
  email_verified,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'mike.johnson@example.com',
  'Mike Johnson',
  'customer',
  '+234-803-456-7890',
  true,
  true,
  true,
  now() - interval '30 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'mike.johnson@example.com');

-- 6. Final verification
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

-- NOTE: Remember to re-enable RLS with proper admin policies later
-- Run this when you're done testing:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 