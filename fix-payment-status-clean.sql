-- Clean fix for payment status update issue
-- This script safely handles existing policies
-- Run this in your Supabase SQL Editor

-- First, let's see what policies currently exist
SELECT 'Current Order Policies:' as info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'orders';

-- Drop only the problematic policies that prevent updates
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Allow order creation" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Allow order updates" ON orders;
DROP POLICY IF EXISTS "Allow payment status updates" ON orders;

-- Don't drop the admin policy if it's working
-- DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

-- Create the essential policies for orders
CREATE POLICY "Allow order creation" ON orders 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow order updates" ON orders 
    FOR UPDATE USING (true);

CREATE POLICY "Users can view own orders" ON orders 
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only create admin policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Admins can manage all orders'
    ) THEN
        EXECUTE 'CREATE POLICY "Admins can manage all orders" ON orders 
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = ''admin''
                )
            )';
    END IF;
END $$;

-- Fix order_items policies only if needed
DO $$
BEGIN
    -- Check if order_items policies need fixing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Allow order items creation'
    ) THEN
        -- Drop existing problematic policies
        DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
        DROP POLICY IF EXISTS "Order items can be created during checkout" ON order_items;
        DROP POLICY IF EXISTS "Allow order items creation" ON order_items;
        DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
        
        -- Create new policies
        CREATE POLICY "Allow order items creation" ON order_items 
            FOR INSERT WITH CHECK (true);

        CREATE POLICY "Users can view own order items" ON order_items 
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM orders 
                    WHERE orders.id = order_items.order_id 
                    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
                ) OR
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

-- Only create admin order_items policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Admins can manage all order items'
    ) THEN
        EXECUTE 'CREATE POLICY "Admins can manage all order items" ON order_items 
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = ''admin''
                )
            )';
    END IF;
END $$;

-- Verify the fix
SELECT 'Fixed Order Policies:' as result;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY policyname;

SELECT 'Order Items Policies:' as result;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'order_items' 
ORDER BY policyname; 