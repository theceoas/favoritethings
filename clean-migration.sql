-- Clean migration script for Bedz&Buttunz database
-- Run this in your Supabase SQL Editor

-- Add delivery method and pickup details to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'shipping' CHECK (delivery_method IN ('shipping', 'pickup'));

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_date DATE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_time TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Create addresses table for saved customer addresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing', 'both')),
    is_default BOOLEAN DEFAULT FALSE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Nigeria',
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default);

-- Enable RLS for addresses table
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view their own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can create their own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON addresses;
DROP POLICY IF EXISTS "Admins can manage all addresses" ON addresses;

-- Create RLS policies for addresses
CREATE POLICY "Users can view their own addresses" ON addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own addresses" ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON addresses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all addresses" ON addresses FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add trigger for updated_at on addresses table
DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at 
    BEFORE UPDATE ON addresses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 