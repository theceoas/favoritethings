-- Check current user profiles and their roles
SELECT id, email, role, created_at FROM profiles ORDER BY created_at;

-- If you need to make a user admin, replace 'your-email@example.com' with your actual email
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- Example: Make the first user admin (usually the account creator)
-- UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);

-- Verify the change
-- SELECT id, email, role FROM profiles WHERE role = 'admin'; 