# 🔧 Create Missing admin_notifications Table

## Problem
The `admin_notifications` table doesn't exist in your database, which is why you're getting:
```
ERROR: 42P01: relation "admin_notifications" does not exist
```

## Solution
Create the complete `admin_notifications` table with all necessary columns, indexes, triggers, and policies.

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Create a new query

### Step 2: Run This Complete SQL Script
Copy and paste this entire SQL code and run it:

```sql
-- Create admin_notifications table from scratch
-- First, drop the table if it exists (just in case)
DROP TABLE IF EXISTS admin_notifications CASCADE;

-- Create the admin_notifications table with all required columns
CREATE TABLE admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('new_order', 'payment_received', 'order_shipped', 'order_delivered', 'low_stock', 'system_alert')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB, -- Additional data like order_id, order_number, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);

-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_admin_notifications_updated_at 
    BEFORE UPDATE ON admin_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - Admins can do everything
CREATE POLICY "Admins can manage all notifications" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert some sample notifications for testing
INSERT INTO admin_notifications (title, message, type, data) VALUES
('New Order Received', 'Order #BZ202412345678 has been placed', 'new_order', '{"order_id": "sample", "order_number": "BZ202412345678"}'),
('Payment Received', 'Payment confirmed for Order #BZ202412345678', 'payment_received', '{"order_id": "sample", "order_number": "BZ202412345678", "amount": 50000}'),
('Low Stock Alert', 'Product "Sample Product" is running low on stock', 'low_stock', '{"product_id": "sample", "product_name": "Sample Product", "current_stock": 5}');

-- Verify the table was created successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'admin_notifications'
ORDER BY ordinal_position;

-- Check if sample data was inserted
SELECT COUNT(*) as total_notifications, 
       COUNT(*) FILTER (WHERE is_read = false) as unread_notifications
FROM admin_notifications;
```

### Step 3: Verify Success
After running the SQL, you should see:
- ✅ Table structure showing all columns
- ✅ 3 sample notifications inserted
- ✅ 3 unread notifications

### Step 4: Test Your App
1. **Refresh your browser page**
2. **Go to the admin dashboard**
3. **You should see a red notification badge with "3"**
4. **Click the bell icon to open notifications**
5. **Test "Mark all read" functionality**

## What This Creates
- ✅ Complete `admin_notifications` table with all columns
- ✅ Proper indexes for performance
- ✅ `updated_at` trigger that works correctly
- ✅ Row Level Security policies for admin access
- ✅ Sample notifications to test with

## Expected Result
- ✅ No more "table does not exist" errors
- ✅ Notification system works completely
- ✅ Red badge appears with notification count
- ✅ "Mark all read" clears the badge immediately

Run this SQL script and your notification system will be fully functional! 