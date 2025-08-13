-- Remove Collections and Related Data
-- This script safely removes all collection-related functionality from the database

-- 1. First, let's see what collection-related tables actually exist
SELECT 'Checking existing collection-related tables...' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%collection%' OR table_name LIKE '%collections%')
ORDER BY table_name;

-- 2. Check if collections table exists before trying to drop
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collections') THEN
        RAISE NOTICE 'Collections table exists - dropping...';
    ELSE
        RAISE NOTICE 'Collections table does not exist - skipping...';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_collections') THEN
        RAISE NOTICE 'Product_collections table exists - dropping...';
    ELSE
        RAISE NOTICE 'Product_collections table does not exist - skipping...';
    END IF;
END $$;

-- 3. Drop collection-related tables (in correct order due to foreign key constraints)
-- Use CASCADE to handle any dependencies
DROP TABLE IF EXISTS product_collections CASCADE;
DROP TABLE IF EXISTS collections CASCADE;

-- 4. Remove any collection-related columns from products table if they exist
-- (This is a safety check in case there are any direct collection references)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'collection_id'
    ) THEN
        ALTER TABLE products DROP COLUMN collection_id;
        RAISE NOTICE 'Dropped collection_id column from products table';
    ELSE
        RAISE NOTICE 'No collection_id column found in products table';
    END IF;
END $$;

-- 5. Remove any collection-related policies if they exist (only if table exists)
DO $$
BEGIN
    -- Only try to drop policies if the collections table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collections') THEN
        DROP POLICY IF EXISTS "Enable read access for all users" ON collections;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON collections;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON collections;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON collections;
        RAISE NOTICE 'Dropped collection policies';
    ELSE
        RAISE NOTICE 'Collections table does not exist - skipping policy drops';
    END IF;
END $$;

-- 6. Remove any collection-related functions if they exist
DROP FUNCTION IF EXISTS get_collection_products(collection_id uuid) CASCADE;
DROP FUNCTION IF EXISTS update_collection_product_count() CASCADE;

-- 7. Remove any collection-related triggers if they exist (only if table exists)
DO $$
BEGIN
    -- Only try to drop triggers if the product_collections table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_collections') THEN
        DROP TRIGGER IF EXISTS update_collection_product_count_trigger ON product_collections;
        RAISE NOTICE 'Dropped collection triggers';
    ELSE
        RAISE NOTICE 'Product_collections table does not exist - skipping trigger drops';
    END IF;
END $$;

-- 8. Verify the cleanup
SELECT 'Collections cleanup completed successfully' as status;

-- 9. Show remaining tables to confirm collections are gone
SELECT 'Remaining tables in database:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT LIKE 'collections%' 
AND table_name NOT LIKE 'product_collections%'
ORDER BY table_name; 