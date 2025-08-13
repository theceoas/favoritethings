-- Create addresses table for user saved addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('shipping', 'billing', 'both')) NOT NULL DEFAULT 'shipping',
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
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default);

-- Enable Row Level Security (RLS)
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own addresses
CREATE POLICY "Users can view their own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own addresses
CREATE POLICY "Users can insert their own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own addresses
CREATE POLICY "Users can update their own addresses" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own addresses
CREATE POLICY "Users can delete their own addresses" ON addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_addresses_updated_at 
  BEFORE UPDATE ON addresses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new record is being set as default, unset all other defaults for this user
  IF NEW.is_default = true THEN
    UPDATE addresses 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to ensure only one default address per user
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- Grant necessary permissions
GRANT ALL ON addresses TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert some sample data (optional - for testing)
-- INSERT INTO addresses (user_id, type, first_name, last_name, address_line_1, city, state, postal_code, country, is_default)
-- VALUES 
--   ('your-user-id-here', 'shipping', 'John', 'Doe', '123 Main Street', 'Lagos', 'Lagos', '100001', 'Nigeria', true),
--   ('your-user-id-here', 'billing', 'John', 'Doe', '456 Business Ave', 'Abuja', 'FCT', '900001', 'Nigeria', false); 