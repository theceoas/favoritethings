-- Add delivery method and pickup details to orders table
ALTER TABLE orders 
ADD COLUMN delivery_method TEXT DEFAULT 'shipping' CHECK (delivery_method IN ('shipping', 'pickup')),
ADD COLUMN pickup_date DATE,
ADD COLUMN pickup_time TEXT,
ADD COLUMN customer_phone TEXT,
ADD COLUMN special_instructions TEXT;

-- Update the order interface to include new fields
COMMENT ON COLUMN orders.delivery_method IS 'Method of delivery: shipping or pickup';
COMMENT ON COLUMN orders.pickup_date IS 'Date selected for store pickup';
COMMENT ON COLUMN orders.pickup_time IS 'Time slot selected for store pickup';
COMMENT ON COLUMN orders.customer_phone IS 'Customer phone number for contact';
COMMENT ON COLUMN orders.special_instructions IS 'Special delivery or pickup instructions'; 