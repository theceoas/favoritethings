-- Sync existing auth users to profiles table
-- This will create profile records for users who don't have them yet

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  marketing_consent,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as full_name,
  'customer' as role,  -- Default to customer role
  true as is_active,
  false as marketing_consent,
  au.created_at,
  now() as updated_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL  -- Only insert users who don't already have profiles
  AND au.email IS NOT NULL;

-- Update existing profiles to have proper email if missing
UPDATE profiles 
SET email = au.email,
    updated_at = now()
FROM auth.users au 
WHERE profiles.id = au.id 
  AND (profiles.email IS NULL OR profiles.email = '');

-- Show the results
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_active,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC; 