-- Make current user an admin
-- Run this in your Supabase SQL editor

-- First, check current user status
SELECT '=== CURRENT USER STATUS ===' as section;
SELECT 
  'Current user' as check,
  auth.uid() as user_id,
  email,
  role,
  full_name
FROM profiles 
WHERE id = auth.uid();

-- Update current user to admin role
SELECT '=== UPDATING TO ADMIN ===' as section;
UPDATE profiles 
SET role = 'admin'
WHERE id = auth.uid();

-- Verify the update
SELECT '=== VERIFICATION ===' as section;
SELECT 
  'Updated user status' as check,
  email,
  role,
  full_name
FROM profiles 
WHERE id = auth.uid();

-- Test admin access
SELECT '=== ADMIN ACCESS TEST ===' as section;
SELECT 
  'Can access all profiles' as check,
  COUNT(*) as total_profiles
FROM profiles;

-- Show all profiles (as admin)
SELECT '=== ALL PROFILES (ADMIN VIEW) ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC; 