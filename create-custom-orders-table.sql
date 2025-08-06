-- Create custom_orders table for AI chatbot integration
CREATE TABLE IF NOT EXISTS custom_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_code TEXT UNIQUE NOT NULL, -- Randomly generated code for customer access
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    product_type TEXT NOT NULL,
    description TEXT NOT NULL,
    budget_range TEXT,
    timeline TEXT,
    special_requirements TEXT,
    reference_images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'quoted', 'approved', 'in_production', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    ai_analysis JSONB, -- AI chatbot conversation analysis
    ai_generated_quote DECIMAL(10,2),
    ai_confidence_score DECIMAL(3,2),
    admin_notes TEXT,
    admin_response TEXT,
    quoted_price DECIMAL(10,2),
    estimated_delivery_date DATE,
    assigned_to UUID REFERENCES profiles(id),
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_orders_order_code ON custom_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_custom_orders_customer_email ON custom_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_created_at ON custom_orders(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_custom_orders_updated_at 
    BEFORE UPDATE ON custom_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage custom orders" ON custom_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Customers can only view their own orders by order_code
CREATE POLICY "Customers can view their custom orders" ON custom_orders
    FOR SELECT USING (
        customer_email = (
            SELECT email FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Function to generate random order code
CREATE OR REPLACE FUNCTION generate_custom_order_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_already BOOLEAN;
BEGIN
    LOOP
        -- Generate a 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM custom_orders WHERE order_code = code) INTO exists_already;
        
        -- If code doesn't exist, return it
        IF NOT exists_already THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE custom_orders IS 'Custom orders created through AI chatbot integration';
COMMENT ON COLUMN custom_orders.order_code IS 'Randomly generated 8-character code for customer access';
COMMENT ON COLUMN custom_orders.ai_analysis IS 'JSON data from AI chatbot conversation analysis';
COMMENT ON COLUMN custom_orders.reference_images IS 'Array of image URLs uploaded by customer'; 