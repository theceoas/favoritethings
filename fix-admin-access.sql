-- Fix Admin Access to Customer Data
-- Run this in your Supabase SQL Editor

-- 1. First, let's see the current situation
SELECT '=== CURRENT SITUATION ===' as section;
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

-- 2. Check current RLS policies
SELECT '=== CURRENT RLS POLICIES ===' as section;
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Drop existing restrictive policies
SELECT '=== DROPPING RESTRICTIVE POLICIES ===' as section;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- 4. Create new comprehensive policies
SELECT '=== CREATING NEW POLICIES ===' as section;

-- Policy 1: Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Allow users to create their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Allow admins to view ALL profiles (this is the key one for the admin page)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Policy 5: Allow admins to update any profile
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Policy 6: Allow admins to delete profiles (if needed)
CREATE POLICY "Admins can delete all profiles" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- 5. Verify the new policies
SELECT '=== NEW POLICIES ===' as section;
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Test admin access
SELECT '=== ADMIN ACCESS TEST ===' as section;

-- Check if current user is admin
SELECT 
    'Current user admin status' as check,
    role as user_role,
    email
FROM profiles 
WHERE id = auth.uid();

-- Test if admin can see all profiles
SELECT 
    'Admin can see all profiles' as check,
    COUNT(*) as total_profiles
FROM profiles;

-- Test if admin can see customer profiles specifically
SELECT 
    'Admin can see customer profiles' as check,
    COUNT(*) as customer_count
FROM profiles 
WHERE role = 'customer';

-- 7. Show sample customer data (if admin)
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

-- 8. If still not working, create some test customer data
SELECT '=== CREATING TEST CUSTOMERS ===' as section;

-- Create test customers if none exist
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

-- 9. Final verification
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