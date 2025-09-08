-- SAFE Fix for admin_notifications trigger issue
-- This only affects the admin_notifications table, not other tables

-- Step 1: Drop only the admin_notifications trigger (keep the function for other tables)
DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON admin_notifications;

-- Step 2: Drop and recreate the admin_notifications table without the trigger
DROP TABLE IF EXISTS admin_notifications CASCADE;

-- Step 3: Create the table without updated_at column (no trigger needed)
CREATE TABLE admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('new_order', 'payment_received', 'order_shipped', 'order_delivered', 'low_stock', 'system_alert')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
    -- No updated_at column = no trigger needed
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);

-- Step 5: Enable Row Level Security
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy for admin access
CREATE POLICY "Admins can manage all notifications" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Step 7: Insert test notifications
INSERT INTO admin_notifications (title, message, type, data) VALUES
('New Order Received', 'Order #BZ202412345678 has been placed', 'new_order', '{"order_id": "sample", "order_number": "BZ202412345678"}'),
('Payment Received', 'Payment confirmed for Order #BZ202412345678', 'payment_received', '{"order_id": "sample", "order_number": "BZ202412345678", "amount": 50000}'),
('Low Stock Alert', 'Product "Sample Product" is running low on stock', 'low_stock', '{"product_id": "sample", "product_name": "Sample Product", "current_stock": 5}');

-- Step 8: Verify the fix worked
SELECT 
    'Table Structure:' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_notifications' 
ORDER BY ordinal_position

UNION ALL

SELECT 
    'Data Check:' as info,
    'Total Notifications' as column_name,
    COUNT(*)::text as data_type,
    'unread: ' || COUNT(*) FILTER (WHERE is_read = false)::text as is_nullable
FROM admin_notifications;

-- The update_updated_at_column() function is preserved for other tables
-- Only the admin_notifications table is changed to not use it 