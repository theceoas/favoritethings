-- Update profiles table to include additional customer management fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent ON profiles(marketing_consent);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET last_login = NOW() 
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last login on auth
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
-- Note: This would typically be handled by your application logic rather than a database trigger

-- Create a function to calculate customer lifetime value
CREATE OR REPLACE FUNCTION calculate_customer_lifetime_value(customer_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_spent DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(total), 0) INTO total_spent
    FROM orders 
    WHERE user_id = customer_id AND status NOT IN ('cancelled', 'refunded');
    
    RETURN total_spent;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get customer segment
CREATE OR REPLACE FUNCTION get_customer_segment(customer_id UUID)
RETURNS TEXT AS $$
DECLARE
    total_spent DECIMAL(10,2);
    order_count INTEGER;
    last_order_date TIMESTAMP;
    days_since_last_order INTEGER;
BEGIN
    -- Get customer stats
    SELECT 
        COALESCE(SUM(total), 0),
        COUNT(*),
        MAX(created_at)
    INTO total_spent, order_count, last_order_date
    FROM orders 
    WHERE user_id = customer_id AND status NOT IN ('cancelled', 'refunded');
    
    -- Calculate days since last order
    IF last_order_date IS NOT NULL THEN
        days_since_last_order := EXTRACT(days FROM NOW() - last_order_date);
    ELSE
        days_since_last_order := 9999;
    END IF;
    
    -- Determine segment
    IF total_spent > 200000 THEN
        RETURN 'vip';
    ELSIF order_count = 0 THEN
        RETURN 'new';
    ELSIF days_since_last_order > 180 THEN
        RETURN 'inactive';
    ELSE
        RETURN 'regular';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a view for customer analytics
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.role,
    p.phone,
    p.is_active,
    p.marketing_consent,
    p.last_login,
    p.email_verified,
    p.created_at,
    p.updated_at,
    p.notes,
    p.tags,
    COALESCE(o.total_orders, 0) as total_orders,
    COALESCE(o.total_spent, 0) as total_spent,
    o.last_order_date,
    CASE 
        WHEN COALESCE(o.total_spent, 0) > 200000 THEN 'vip'
        WHEN COALESCE(o.total_orders, 0) = 0 THEN 'new'
        WHEN o.last_order_date IS NULL OR o.last_order_date < NOW() - INTERVAL '180 days' THEN 'inactive'
        ELSE 'regular'
    END as customer_segment
FROM profiles p
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_orders,
        SUM(total) as total_spent,
        MAX(created_at) as last_order_date
    FROM orders 
    WHERE status NOT IN ('cancelled', 'refunded')
    GROUP BY user_id
) o ON p.id = o.user_id
WHERE p.role = 'customer';

-- Grant access to the view for admins
ALTER VIEW customer_analytics OWNER TO postgres;

-- Create RLS policy for the view
ALTER VIEW customer_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view customer analytics" ON customer_analytics FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Sample data update (optional - updates existing customers to have proper defaults)
UPDATE profiles 
SET 
    is_active = COALESCE(is_active, TRUE),
    marketing_consent = COALESCE(marketing_consent, FALSE),
    email_verified = COALESCE(email_verified, TRUE)
WHERE role = 'customer';

COMMENT ON TABLE profiles IS 'User profiles with enhanced customer management fields';
COMMENT ON VIEW customer_analytics IS 'Comprehensive customer analytics view with calculated metrics'; 