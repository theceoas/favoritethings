-- Create the 'others' table for snacks and accessories
CREATE TABLE IF NOT EXISTS others (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('snacks', 'accessories')),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  barcode VARCHAR(100) UNIQUE,
  inventory_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  track_inventory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_others_category ON others(category);
CREATE INDEX IF NOT EXISTS idx_others_is_active ON others(is_active);
CREATE INDEX IF NOT EXISTS idx_others_sort_order ON others(sort_order);
CREATE INDEX IF NOT EXISTS idx_others_barcode ON others(barcode);
CREATE INDEX IF NOT EXISTS idx_others_inventory ON others(inventory_quantity);

-- Enable Row Level Security
ALTER TABLE others ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all others" ON others
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert others" ON others
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update others" ON others
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete others" ON others
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert some sample data with inventory
INSERT INTO others (name, description, image_url, category, price, barcode, inventory_quantity, low_stock_threshold, sort_order) VALUES
('Premium Snacks Pack', 'Delicious assortment of premium snacks and treats', 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=80', 'snacks', 1500.00, 'SNACK001', 25, 5, 1),
('Fashion Jewelry Set', 'Elegant jewelry collection for any occasion', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', 'accessories', 2500.00, 'ACC001', 15, 3, 2),
('Organic Snack Mix', 'Healthy organic snack mix with nuts and dried fruits', 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=800&q=80', 'snacks', 800.00, 'SNACK002', 8, 5, 3),
('Designer Handbag', 'Stylish designer handbag for fashion enthusiasts', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', 'accessories', 5000.00, 'ACC002', 5, 2, 4),
('Gourmet Chocolate Box', 'Premium chocolate selection in elegant packaging', 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=800&q=80', 'snacks', 1200.00, 'SNACK003', 12, 4, 5),
('Statement Necklace', 'Bold statement necklace for special occasions', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', 'accessories', 1800.00, 'ACC003', 10, 3, 6);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_others_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_others_updated_at_trigger
  BEFORE UPDATE ON others
  FOR EACH ROW
  EXECUTE FUNCTION update_others_updated_at(); 