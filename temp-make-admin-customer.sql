-- Temporarily change one admin to customer for testing
-- REMEMBER TO CHANGE IT BACK LATER!

-- First, let's see what we have
SELECT id, email, role FROM profiles;

-- Change one admin to customer (using the asofficial001@yahoo.com user)
UPDATE profiles 
SET role = 'customer'
WHERE email = 'asofficial001@yahoo.com';

-- Verify the change
SELECT id, email, role FROM profiles; 