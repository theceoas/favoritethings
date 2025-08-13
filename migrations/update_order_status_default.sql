-- Update the default value for order status from 'pending' to 'confirmed'
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'confirmed';

-- Add comment to document the change
COMMENT ON COLUMN orders.status IS 'Order status - default is now confirmed instead of pending'; 