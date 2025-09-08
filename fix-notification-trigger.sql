-- Fix the notification trigger issue
-- Run this in your Supabase SQL Editor

-- First, drop the problematic trigger
DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON admin_notifications;

-- Drop the function too (in case it's corrupted)
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate the table without the problematic trigger
DROP TABLE IF EXISTS admin_notifications CASCADE;

-- Create a simpler version without the updated_at trigger
CREATE TABLE admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('new_order', 'payment_received', 'order_shipped', 'order_delivered', 'low_stock', 'system_alert')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
    -- Note: Removing updated_at column and trigger to avoid issues
);

-- Create indexes
CREATE INDEX idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Admins can manage all notifications" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert test data
INSERT INTO admin_notifications (title, message, type, data) VALUES
('New Order Received', 'Order #BZ202412345678 has been placed', 'new_order', '{"order_id": "sample"}'),
('Payment Received', 'Payment confirmed for Order #BZ202412345678', 'payment_received', '{"order_id": "sample"}'),
('Low Stock Alert', 'Product "Sample Product" is running low on stock', 'low_stock', '{"product_id": "sample"}');

-- Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_notifications' 
ORDER BY ordinal_position;

-- Check data
SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_read = false) as unread 
FROM admin_notifications; 