-- Fix RLS policies for custom_orders table to allow chatbot API access

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'custom_orders';

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Admins can manage custom orders" ON custom_orders;
DROP POLICY IF EXISTS "Customers can view their custom orders" ON custom_orders;

-- Create new policies that allow public inserts but restrict other operations
-- Allow anyone to create custom orders (for chatbot API)
CREATE POLICY "Public can create custom orders" ON custom_orders
    FOR INSERT
    WITH CHECK (true);

-- Allow admins to do everything
CREATE POLICY "Admins can manage custom orders" ON custom_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow customers to view their own orders by email
CREATE POLICY "Customers can view their custom orders" ON custom_orders
    FOR SELECT USING (
        customer_email = (
            SELECT email FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Allow updates only by admins or the customer who created it
CREATE POLICY "Admins and customers can update custom orders" ON custom_orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        ) OR
        customer_email = (
            SELECT email FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'custom_orders'; 