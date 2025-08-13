-- Fix RLS Policies for Customers Admin Page
-- This script will ensure admins can view all customer profiles

-- 1. First, let's see what policies currently exist
SELECT '=== CURRENT POLICIES ===' as section;
SELECT policyname, cmd, permissive, roles, qual FROM pg_policies WHERE tablename = 'profiles';

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- 3. Create new comprehensive policies
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

-- 4. Verify the new policies
SELECT '=== NEW POLICIES ===' as section;
SELECT policyname, cmd, permissive, roles, qual FROM pg_policies WHERE tablename = 'profiles';

-- 5. Test admin access
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

-- 6. Show sample customer data (if admin)
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

-- 7. If still not working, try bypassing RLS temporarily for testing
-- (Only run this if the above policies don't work)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 8. Alternative: Create a view for admin access
CREATE OR REPLACE VIEW admin_customers AS
SELECT 
    p.*,
    CASE 
        WHEN p.created_at > NOW() - INTERVAL '30 days' THEN 'new'
        WHEN p.last_login IS NULL OR p.last_login < NOW() - INTERVAL '90 days' THEN 'inactive'
        ELSE 'regular'
    END as customer_segment
FROM profiles p
WHERE p.role = 'customer';

-- Grant access to the view
GRANT SELECT ON admin_customers TO authenticated;

-- Create RLS policy for the view
ALTER VIEW admin_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view customer analytics" ON admin_customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

SELECT '=== VIEW CREATED ===' as section;
SELECT 'admin_customers view created with RLS policy' as status; 