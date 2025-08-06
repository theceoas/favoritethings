-- Drop existing tables and functions if they exist
DROP TABLE IF EXISTS promotion_usage CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP FUNCTION IF EXISTS update_promotion_usage_count CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- Create promotions table
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER NOT NULL DEFAULT 1,
  times_used INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promotion usage tracking table
CREATE TABLE promotion_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES promotions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(promotion_id, user_id, order_id)
);

-- Create function to update promotion usage count
CREATE OR REPLACE FUNCTION update_promotion_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promotions
  SET times_used = times_used + 1
  WHERE id = NEW.promotion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update promotion usage count
CREATE TRIGGER update_promotion_usage_count_trigger
AFTER INSERT ON promotion_usage
FOR EACH ROW
EXECUTE FUNCTION update_promotion_usage_count();

-- Create RLS policies
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can do everything with promotions
CREATE POLICY "Admins can do everything on promotions"
ON promotions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Users can view active promotions
CREATE POLICY "Users can view active promotions"
ON promotions
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND NOW() BETWEEN valid_from AND valid_until
  AND NOT EXISTS (
    SELECT 1 FROM promotion_usage
    WHERE promotion_id = promotions.id
    AND user_id = auth.uid()
    AND times_used >= usage_limit
  )
);

-- Users can view their own promotion usage
CREATE POLICY "Users can view their own promotion usage"
ON promotion_usage
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can do everything with promotion usage
CREATE POLICY "Admins can do everything on promotion usage"
ON promotion_usage
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create indexes
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active_dates ON promotions(is_active, valid_from, valid_until);
CREATE INDEX idx_promotion_usage_user ON promotion_usage(user_id);
CREATE INDEX idx_promotion_usage_promotion ON promotion_usage(promotion_id);

-- Create stored procedure for recording promotion usage
CREATE OR REPLACE FUNCTION record_promotion_usage(
  p_promotion_id UUID,
  p_user_id UUID,
  p_order_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Insert usage record
    INSERT INTO promotion_usage (
      promotion_id,
      user_id,
      order_id,
      used_at
    ) VALUES (
      p_promotion_id,
      p_user_id,
      p_order_id,
      NOW()
    );

    -- Update promotion usage count
    UPDATE promotions
    SET times_used = times_used + 1
    WHERE id = p_promotion_id;

    -- Commit transaction
    COMMIT;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on any error
    ROLLBACK;
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Add promotion_id to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_promotion_id ON orders(promotion_id); 