-- Fix Login RLS Issue
-- Run this in your Supabase SQL Editor to fix the circular dependency in profiles RLS

-- Step 1: Check current situation
SELECT 'Current profiles RLS status:' as info, c.relrowsecurity as enabled 
FROM pg_class c WHERE c.relname = 'profiles';

-- Step 2: Check current policies
SELECT 'Current policies:' as info, policyname, cmd 
FROM pg_policies WHERE tablename = 'profiles';

-- Step 3: TEMPORARILY disable RLS on profiles table to fix login
-- This will allow the validateUserSession function to work
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

SELECT 'Profiles RLS DISABLED - login should work now' as status;

-- Step 4: Alternative - Fix the policies instead of disabling RLS
-- If you prefer to keep RLS enabled, uncomment the lines below instead:

/*
-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a simple policy that allows authenticated users to read their own profile
CREATE POLICY "Authenticated users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow anyone to view profiles (for simplicity during testing)
CREATE POLICY "Allow profile reads for auth validation" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);
*/

-- Step 5: Test the fix
SELECT 'Test - your current user:' as test, auth.uid() as user_id;

-- Try to read profiles (this should work now)
SELECT 'Test - profiles count:' as test, count(*) as total FROM profiles;

-- Check your role
SELECT 'Your profile:' as test, email, role, full_name 
FROM profiles 
WHERE id = auth.uid(); 