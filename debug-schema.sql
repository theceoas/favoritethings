-- Step 1: Check if categories table exists, if not create it
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Temporarily disable RLS to test connection
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Step 3: Insert test data
INSERT INTO categories (name, slug) VALUES
('Test Category', 'test-category')
ON CONFLICT (slug) DO NOTHING;

-- Step 4: Test if we can query it
SELECT COUNT(*) FROM categories; 