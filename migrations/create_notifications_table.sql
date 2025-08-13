-- Create notifications table for admin notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('new_order', 'payment_received', 'order_shipped', 'order_delivered', 'low_stock', 'system_alert')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB, -- Additional data like order_id, order_number, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_notifications_updated_at 
    BEFORE UPDATE ON admin_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
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