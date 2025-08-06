-- Create some test customer accounts
-- Run this in your Supabase SQL editor

INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  is_active,
  marketing_consent,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'john.doe@example.com',
    'John Doe',
    'customer',
    '+234-801-234-5678',
    true,
    true,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'jane.smith@example.com',
    'Jane Smith',
    'customer',
    '+234-802-345-6789',
    true,
    false,
    now() - interval '15 days',
    now()
  ),
  (
    gen_random_uuid(),
    'mike.johnson@example.com',
    'Mike Johnson',
    'customer',
    '+234-803-456-7890',
    true,
    true,
    now() - interval '30 days',
    now()
  ),
  (
    gen_random_uuid(),
    'sarah.wilson@example.com',
    'Sarah Wilson',
    'customer',
    '+234-804-567-8901',
    false,
    false,
    now() - interval '60 days',
    now()
  ),
  (
    gen_random_uuid(),
    'david.brown@example.com',
    'David Brown',
    'customer',
    null,
    true,
    true,
    now() - interval '90 days',
    now()
  );

-- Verify the insert
SELECT id, email, full_name, role, created_at FROM profiles WHERE role = 'customer'; 