-- Quick Admin Setup
-- Run this in your Supabase SQL Editor to make yourself an admin

-- Step 1: Check who you are
SELECT 'Current user:' as info, auth.uid() as user_id;

-- Step 2: Check your current profile
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE id = auth.uid();

-- Step 3: Make yourself admin (update YOUR_EMAIL with your actual email)
-- IMPORTANT: Replace 'your.email@example.com' with your actual email address
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your.email@example.com';

-- Alternative: If you know your user ID, use this instead:
-- UPDATE profiles SET role = 'admin' WHERE id = auth.uid();

-- Step 4: Verify the change
SELECT 
    'Updated role:' as info,
    email,
    role
FROM profiles 
WHERE id = auth.uid(); 