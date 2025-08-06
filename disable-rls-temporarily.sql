-- Temporarily disable RLS on profiles table for testing
-- REMEMBER TO RE-ENABLE IT LATER FOR SECURITY!

-- Check current RLS status
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';

-- Test query that should now work
SELECT role, COUNT(*) as count
FROM profiles 
GROUP BY role; 