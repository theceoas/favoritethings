-- Test Admin Access for Customers Page
-- Run this to verify your admin status and access

-- 1. Check current user
SELECT '=== CURRENT USER ===' as section;
SELECT 
    'Current user' as info,
    auth.uid() as user_id,
    current_user,
    session_user;

-- 2. Check if current user has a profile
SELECT '=== USER PROFILE ===' as section;
SELECT 
    'User profile' as info,
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE id = auth.uid();

-- 3. Test if user can see profiles table at all
SELECT '=== BASIC ACCESS TEST ===' as section;
SELECT 
    'Can access profiles table' as test,
    COUNT(*) as total_profiles
FROM profiles;

-- 4. Test if user can see customer profiles
SELECT '=== CUSTOMER ACCESS TEST ===' as section;
SELECT 
    'Can see customer profiles' as test,
    COUNT(*) as customer_count
FROM profiles 
WHERE role = 'customer';

-- 5. Show sample customer data (if accessible)
SELECT '=== SAMPLE CUSTOMERS ===' as section;
SELECT 
    'Sample customers' as info,
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE role = 'customer'
ORDER BY created_at DESC
LIMIT 3;

-- 6. Check RLS status
SELECT '=== RLS STATUS ===' as section;
SELECT 
    'RLS enabled' as info,
    relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public' AND c.relname = 'profiles';

-- 7. Show current policies
SELECT '=== CURRENT POLICIES ===' as section;
SELECT 
    'Active policies' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. Recommendations based on results
SELECT '=== RECOMMENDATIONS ===' as section;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE id = auth.uid()) = 0 
        THEN 'No profile found for current user. Create a profile first.'
        WHEN (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin'
        THEN 'Current user is not an admin. Update role to admin in profiles table.'
        WHEN (SELECT COUNT(*) FROM profiles WHERE role = 'customer') = 0
        THEN 'No customers found. Run create-test-customers.sql to add test data.'
        ELSE 'User is admin and customers exist. Check browser console for JavaScript errors.'
    END as recommendation; 