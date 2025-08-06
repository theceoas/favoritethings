-- Fix payment status update issue
-- This SQL addresses the specific issue where payment status remains pending
-- Run this in your Supabase SQL Editor

-- First, check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'orders';

-- Drop all existing order policies to start fresh
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Allow order creation" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Allow order updates" ON orders;
DROP POLICY IF EXISTS "Allow payment status updates" ON orders;

-- Create comprehensive policies for orders
-- 1. Allow anyone to create orders (for guest checkout)
CREATE POLICY "Allow order creation" ON orders 
    FOR INSERT WITH CHECK (true);

-- 2. Allow anyone to update orders (for payment status updates)
-- This is critical for Paystack payment confirmation
CREATE POLICY "Allow order updates" ON orders 
    FOR UPDATE USING (true);

-- 3. Allow users to view their own orders
CREATE POLICY "Users can view own orders" ON orders 
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Allow admins full access
CREATE POLICY "Admins can manage all orders" ON orders 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Fix order_items policies too
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Order items can be created during checkout" ON order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
DROP POLICY IF EXISTS "Allow order items creation" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

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

CREATE POLICY "Admins can manage all order items" ON order_items 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Test the policies
SELECT 'Fixed RLS Policies - Orders table:' as test;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'orders';

-- Verify RLS is enabled
SELECT 'Orders RLS Status:' as test, 
       c.relrowsecurity as enabled 
FROM pg_class c 
WHERE c.relname = 'orders'; 