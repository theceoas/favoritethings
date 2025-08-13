-- Check what tables exist in the database
-- Run this in your Supabase SQL editor

-- 1. List all tables
SELECT '=== ALL TABLES ===' as section;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check if customers table exists
SELECT '=== CUSTOMERS TABLE CHECK ===' as section;
SELECT 
  'Customers table exists' as check,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) as result;

-- 3. Check if profiles table exists
SELECT '=== PROFILES TABLE CHECK ===' as section;
SELECT 
  'Profiles table exists' as check,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) as result;

-- 4. If customers table exists, show its structure
SELECT '=== CUSTOMERS TABLE STRUCTURE ===' as section;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- 5. If profiles table exists, show its structure
SELECT '=== PROFILES TABLE STRUCTURE ===' as section;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Check data in customers table (if it exists)
SELECT '=== CUSTOMERS TABLE DATA ===' as section;
SELECT 
  'Customer count' as check,
  COUNT(*) as count
FROM customers;

-- 7. Check data in profiles table (if it exists)
SELECT '=== PROFILES TABLE DATA ===' as section;
SELECT 
  'Profile count' as check,
  COUNT(*) as count
FROM profiles;

-- 8. Show sample data from both tables
SELECT '=== SAMPLE CUSTOMERS DATA ===' as section;
SELECT * FROM customers LIMIT 3;

SELECT '=== SAMPLE PROFILES DATA ===' as section;
SELECT * FROM profiles LIMIT 3; 