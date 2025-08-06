-- Fix Collections RLS Policies
-- Run this in your Supabase SQL Editor to fix collection creation issues

-- Step 1: Check current user and collections status
SELECT 'Current authenticated user:' as info, auth.uid() as user_id;

-- Step 2: Check if you have admin role
SELECT 
    'Your current role:' as info, 
    role,
    email,
    full_name
FROM profiles 
WHERE id = auth.uid();

-- Step 3: Check collections table RLS status
SELECT 
    'Collections RLS enabled:' as info,
    c.relrowsecurity as enabled 
FROM pg_class c 
WHERE c.relname = 'collections';

-- Step 4: Check current policies on collections table
SELECT 
    'Current collections policies:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'collections';

-- Step 5: TEMPORARILY make collections creation more permissive for testing
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public read access for collections" ON collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON collections;

-- Create more permissive policies for testing
CREATE POLICY "Allow read access to collections" ON collections
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage collections" ON collections
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Step 6: Test if you can now create a collection
DO $$
DECLARE
    test_collection_id UUID;
BEGIN
    -- Try to insert a test collection
    INSERT INTO collections (name, slug, description, is_featured, is_active)
    VALUES (
        'Test Collection - DELETE ME',
        'test-collection-delete-me',
        'This is a test collection created to verify permissions',
        false,
        true
    ) RETURNING id INTO test_collection_id;
    
    RAISE NOTICE 'SUCCESS: Test collection created with ID: %', test_collection_id;
    
    -- Clean up the test collection
    DELETE FROM collections WHERE id = test_collection_id;
    RAISE NOTICE 'Test collection cleaned up successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Could not create test collection: %', SQLERRM;
END $$;

-- Step 7: Set your account as admin (replace YOUR_EMAIL with your actual email)
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';

-- Step 8: Optional - Restore more restrictive policies after testing
-- Uncomment these lines after confirming collection creation works:

-- DROP POLICY IF EXISTS "Allow read access to collections" ON collections;
-- DROP POLICY IF EXISTS "Allow authenticated users to manage collections" ON collections;

-- CREATE POLICY "Public read access for collections" ON collections
--     FOR SELECT USING (is_active = true);

-- CREATE POLICY "Admins can manage collections" ON collections
--     FOR ALL USING (
--         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--     );

-- Final verification
SELECT 'Collections count:' as info, COUNT(*) as total FROM collections; 