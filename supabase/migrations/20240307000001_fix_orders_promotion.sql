-- Fix orders table promotion_id column
DO $$ 
BEGIN
    -- Add promotion_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'promotion_id'
    ) THEN
        ALTER TABLE orders
        ADD COLUMN promotion_id UUID REFERENCES promotions(id);
        
        -- Create index for better performance
        CREATE INDEX idx_orders_promotion_id ON orders(promotion_id);
    END IF;
END $$;

-- Refresh the schema cache
ALTER TABLE orders SET SCHEMA public;
ALTER TABLE orders SET SCHEMA public;

-- Add helpful comment
COMMENT ON COLUMN orders.promotion_id IS 'Reference to the promotion used for this order'; 