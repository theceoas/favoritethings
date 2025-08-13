-- Add admin policy to allow admins to view all profiles
-- Run this in your Supabase SQL editor

-- First, let's see the current policies
SELECT '=== CURRENT POLICIES ===' as section;
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- Add policy for admins to view all profiles
SELECT '=== ADDING ADMIN POLICY ===' as section;

-- Drop the policy if it already exists
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create the admin policy
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Verify the new policy was created
SELECT '=== VERIFICATION ===' as section;
SELECT 
  'New admin policy created' as check,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'Admins can view all profiles';

-- Test if current user is admin
SELECT '=== ADMIN STATUS CHECK ===' as section;
SELECT 
  'Current user admin status' as check,
  role as user_role,
  email
FROM profiles 
WHERE id = auth.uid();

-- Test admin access to all profiles
SELECT '=== ADMIN ACCESS TEST ===' as section;
SELECT 
  'Admin can see all profiles' as check,
  COUNT(*) as total_profiles
FROM profiles;

-- Test admin access to customer profiles specifically
SELECT '=== CUSTOMER ACCESS TEST ===' as section;
SELECT 
  'Admin can see customer profiles' as check,
  COUNT(*) as customer_count
FROM profiles 
WHERE role = 'customer';

-- Show sample customer data (without last_login column)
SELECT '=== SAMPLE CUSTOMER DATA ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  created_at,
  updated_at
FROM profiles 
WHERE role = 'customer'
ORDER BY created_at DESC
LIMIT 5; 