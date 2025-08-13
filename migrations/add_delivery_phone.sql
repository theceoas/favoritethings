-- Add delivery_phone column to orders table
ALTER TABLE orders ADD COLUMN delivery_phone TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN orders.delivery_phone IS 'Optional phone number for delivery person when order is shipped'; 