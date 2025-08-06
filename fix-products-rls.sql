-- Fix Products RLS Policies
-- Run this in your Supabase SQL Editor to fix product loading issues

-- Step 1: Check current user and products status
SELECT 'Current authenticated user:' as info, auth.uid() as user_id;

-- Step 2: Check if you have admin role
SELECT 
    'Your current role:' as info, 
    role,
    email,
    full_name
FROM profiles 
WHERE id = auth.uid();

-- Step 3: Check products table RLS status
SELECT 
    'Products RLS enabled:' as info,
    c.relrowsecurity as enabled 
FROM pg_class c 
WHERE c.relname = 'products';

-- Step 4: Check current policies on products table
SELECT 
    'Current products policies:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'products';

-- Step 5: TEMPORARILY disable RLS on products for testing
-- WARNING: This makes products publicly accessible!
-- Only use for testing, re-enable RLS after fixing permissions

-- Uncomment these lines if you want to temporarily disable RLS:
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- SELECT 'Products RLS DISABLED for testing' as status;

-- Step 6: Create proper RLS policies for products
-- Drop existing policies first (if any)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Only authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Only authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Only authenticated users can delete products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;

-- Create new comprehensive policies
-- 1. Allow public read access for active products
CREATE POLICY "Allow public read for active products" ON products
    FOR SELECT USING (is_active = true);

-- 2. Allow admin users full access
CREATE POLICY "Allow admin full access to products" ON products
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- 3. Re-enable RLS (if it was disabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 7: Also fix related tables that might be causing issues

-- Fix product_categories table RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON product_categories;
CREATE POLICY "Enable read access for all users" ON product_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin full access to product_categories" ON product_categories;
CREATE POLICY "Allow admin full access to product_categories" ON product_categories
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Fix product_collections table RLS
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON product_collections;
CREATE POLICY "Enable read access for all users" ON product_collections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin full access to product_collections" ON product_collections;
CREATE POLICY "Allow admin full access to product_collections" ON product_collections
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Fix product_filter_values table RLS (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_filter_values') THEN
        ALTER TABLE product_filter_values ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Enable read access for all users" ON product_filter_values;
        CREATE POLICY "Enable read access for all users" ON product_filter_values
            FOR SELECT USING (true);
            
        DROP POLICY IF EXISTS "Allow admin full access to product_filter_values" ON product_filter_values;
        CREATE POLICY "Allow admin full access to product_filter_values" ON product_filter_values
            FOR ALL USING (
                auth.uid() IN (
                    SELECT id FROM profiles WHERE role = 'admin'
                )
            );
    END IF;
END $$;

-- Step 8: Test the fixes
SELECT 'Testing products access...' as info;

-- Test public read access
SELECT 
    'Public products count:' as info,
    COUNT(*) as count
FROM products 
WHERE is_active = true;

-- Test admin access (if you're admin)
SELECT 
    'Admin products count:' as info,
    COUNT(*) as count
FROM products;

SELECT '✅ Products RLS policies have been fixed!' as status;
SELECT 'Try refreshing your products page now' as next_step; 