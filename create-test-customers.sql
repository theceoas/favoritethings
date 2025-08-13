-- Create test customer data in profiles table
-- Run this in your Supabase SQL editor

-- First, check if we have any customer profiles
SELECT '=== CHECKING EXISTING CUSTOMERS ===' as section;
SELECT 
  'Existing customer profiles' as check,
  COUNT(*) as count
FROM profiles 
WHERE role = 'customer';

-- If no customers exist, create some test data
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  marketing_consent,
  email_verified,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'john.doe@example.com',
  'John Doe',
  'customer',
  '+234-801-234-5678',
  true,
  true,
  true,
  now() - interval '5 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'john.doe@example.com');

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  marketing_consent,
  email_verified,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'jane.smith@example.com',
  'Jane Smith',
  'customer',
  '+234-802-345-6789',
  true,
  false,
  true,
  now() - interval '15 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'jane.smith@example.com');

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  marketing_consent,
  email_verified,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'mike.johnson@example.com',
  'Mike Johnson',
  'customer',
  '+234-803-456-7890',
  true,
  true,
  true,
  now() - interval '30 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'mike.johnson@example.com');

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  marketing_consent,
  email_verified,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'sarah.wilson@example.com',
  'Sarah Wilson',
  'customer',
  '+234-804-567-8901',
  false,
  false,
  true,
  now() - interval '60 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'sarah.wilson@example.com');

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  marketing_consent,
  email_verified,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'david.brown@example.com',
  'David Brown',
  'customer',
  null,
  true,
  true,
  true,
  now() - interval '90 days',
  now()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'david.brown@example.com');

-- Verify the insert
SELECT '=== VERIFICATION ===' as section;
SELECT 
  'Total customer profiles after insert' as check,
  COUNT(*) as count
FROM profiles 
WHERE role = 'customer';

-- Show the new customer data
SELECT '=== NEW CUSTOMER DATA ===' as section;
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  created_at
FROM profiles 
WHERE role = 'customer'
ORDER BY created_at DESC; 