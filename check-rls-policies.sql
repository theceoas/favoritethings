-- Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasbypassrls
FROM pg_tables 
WHERE tablename = 'profiles';

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
  'Direct count' as test,
  count(*) as total
FROM profiles;

-- Test with role filter
SELECT 
  'Customer count' as test,
  count(*) as total  
FROM profiles 
WHERE role = 'customer';

-- Test with all roles
SELECT 
  role,
  count(*) as count
FROM profiles 
GROUP BY role; 