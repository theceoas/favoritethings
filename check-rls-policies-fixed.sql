-- Fixed RLS policy check for Supabase
-- Check if RLS is enabled on profiles table
SELECT 
  c.relname AS tablename,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public' AND c.relname = 'profiles';

-- Check what policies exist
SELECT 
  pol.policyname,
  pol.cmd,
  pol.permissive,
  pol.roles,
  pol.qual,
  pol.with_check
FROM pg_policies pol
WHERE pol.tablename = 'profiles';

-- Test query to see what profiles we can actually see
SELECT 
  'Direct count' AS test,
  COUNT(*) AS total
FROM profiles;

-- Test with role filter
SELECT 
  'Customer count' AS test,
  COUNT(*) AS total  
FROM profiles 
WHERE role = 'customer';

-- Test with all roles
SELECT 
  role,
  COUNT(*) AS count
FROM profiles 
GROUP BY role;

-- Check current user context
SELECT 
  current_user,
  session_user,
  current_setting('role') as current_role; 