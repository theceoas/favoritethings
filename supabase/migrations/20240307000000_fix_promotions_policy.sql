-- Drop existing policies
DROP POLICY IF EXISTS "Users can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Admins can do everything on promotions" ON promotions;

-- Create new policies
-- Admins can do everything
CREATE POLICY "Admins can do everything on promotions"
ON promotions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Users can view active promotions that they haven't used and haven't reached global limit
CREATE POLICY "Users can view active promotions"
ON promotions
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND NOW() BETWEEN valid_from AND valid_until
  AND times_used < usage_limit
  AND NOT EXISTS (
    SELECT 1 FROM promotion_usage
    WHERE promotion_id = promotions.id
    AND user_id = auth.uid()
  )
); 