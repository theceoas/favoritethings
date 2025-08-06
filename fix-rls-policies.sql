-- Fix RLS policies for categories table

-- First, let's enable RLS but with more permissive policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Allow anonymous read" ON categories;

-- Create a permissive policy that allows everyone to read categories
CREATE POLICY "Allow public read access to categories" ON categories
    FOR SELECT USING (true);

-- Also allow inserts for testing (we can restrict this later)
CREATE POLICY "Allow public insert to categories" ON categories
    FOR INSERT WITH CHECK (true);

-- Let's also fix the profiles table policies
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- Create new, more permissive policies for now
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow profile creation" ON profiles
    FOR INSERT WITH CHECK (true);

-- Test the policies by selecting from categories
SELECT 'Categories count:' as test, COUNT(*) as count FROM categories; 