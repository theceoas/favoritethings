-- Fix promotions table structure
-- =============================

-- 1. Add created_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'created_by') THEN
        ALTER TABLE promotions ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Add brand_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'brand_id') THEN
        ALTER TABLE promotions ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'is_active') THEN
        ALTER TABLE promotions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'times_used') THEN
        ALTER TABLE promotions ADD COLUMN times_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'created_at') THEN
        ALTER TABLE promotions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'updated_at') THEN
        ALTER TABLE promotions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Create index for brand_id
CREATE INDEX IF NOT EXISTS idx_promotions_brand_id ON promotions(brand_id);

-- 5. Create index for created_by
CREATE INDEX IF NOT EXISTS idx_promotions_created_by ON promotions(created_by);

-- 6. Enable RLS on promotions if not already enabled
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for promotions
DROP POLICY IF EXISTS "Allow public read access to promotions" ON promotions;
CREATE POLICY "Allow public read access to promotions" ON promotions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert promotions" ON promotions;
CREATE POLICY "Allow authenticated users to insert promotions" ON promotions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update promotions" ON promotions;
CREATE POLICY "Allow authenticated users to update promotions" ON promotions
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete promotions" ON promotions;
CREATE POLICY "Allow authenticated users to delete promotions" ON promotions
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at 
    BEFORE UPDATE ON promotions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 