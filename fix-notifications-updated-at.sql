-- Fix admin_notifications table missing updated_at column
-- Run this in your Supabase SQL Editor

-- Option 1: Add the missing updated_at column
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