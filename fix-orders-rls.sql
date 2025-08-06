-- Fix RLS policies for orders table to allow order creation
-- Run this in your Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Allow order creation" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Allow order updates" ON orders;

-- Create more permissive policies for orders
-- Allow anyone (including anonymous users) to create orders
CREATE POLICY "Allow order creation" ON orders 
    FOR INSERT WITH CHECK (true);

-- Allow updating orders (needed for payment status updates)
CREATE POLICY "Allow order updates" ON orders 
    FOR UPDATE USING (true);

-- Allow users to view their own orders (when authenticated)
CREATE POLICY "Users can view own orders" ON orders 
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL
    );

-- Allow admins to manage all orders
CREATE POLICY "Admins can manage all orders" ON orders 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Also fix order_items table policies
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Order items can be created during checkout" ON order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
DROP POLICY IF EXISTS "Allow order items creation" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

-- Allow anyone to create order items (needed during checkout)
CREATE POLICY "Allow order items creation" ON order_items 
    FOR INSERT WITH CHECK (true);

-- Allow viewing order items if user owns the order
CREATE POLICY "Users can view own order items" ON order_items 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

-- Allow admins to manage all order items
CREATE POLICY "Admins can manage all order items" ON order_items 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Test the policies
SELECT 'Orders table RLS enabled:' as test, 
       c.relrowsecurity as enabled 
FROM pg_class c 
WHERE c.relname = 'orders';

SELECT 'Order items table RLS enabled:' as test, 
       c.relrowsecurity as enabled 
FROM pg_class c 
WHERE c.relname = 'order_items'; 