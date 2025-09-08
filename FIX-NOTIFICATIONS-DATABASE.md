# 🔧 Fix Notifications Database Issue

## Problem
The `admin_notifications` table is missing the `updated_at` column, but there's a database trigger trying to update it, causing the error:
```
"record \"new\" has no field \"updated_at\""
```

## Solution
You need to add the missing `updated_at` column to your Supabase database.

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Create a new query

### Step 2: Run the Fix SQL
Copy and paste this SQL code and run it:

```sql
-- Fix admin_notifications table missing updated_at column
-- Add the missing updated_at column
ALTER TABLE admin_notifications 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have updated_at = created_at
UPDATE admin_notifications 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger (in case it was broken)
DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON admin_notifications;
CREATE TRIGGER update_admin_notifications_updated_at
    BEFORE UPDATE ON admin_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admin_notifications'
ORDER BY ordinal_position;
```

### Step 3: Refresh Your App
After running the SQL:
1. **Refresh your browser page** to get the updated code
2. **Test the "Mark all read" functionality**
3. The red badge should now disappear properly

## What This Fix Does
1. ✅ Adds the missing `updated_at` column
2. ✅ Sets `updated_at = created_at` for existing records
3. ✅ Creates the proper trigger function
4. ✅ Recreates the trigger to work correctly
5. ✅ Updates TypeScript types to match

## Expected Result
- ✅ No more database errors
- ✅ "Mark all read" works properly
- ✅ Red notification badge disappears immediately
- ✅ All notification functionality restored

Run this SQL fix and then test the notifications again! 