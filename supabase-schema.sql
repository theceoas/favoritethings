-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE address_type AS ENUM ('shipping', 'billing');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed', 'free_shipping');
CREATE TYPE content_block_type AS ENUM ('hero_banner', 'featured_collection', 'announcement', 'testimonial');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'customer',
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table for multi-brand structure
CREATE TABLE brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#F59E0B',
    secondary_color TEXT DEFAULT '#EA580C',
    accent_color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table
CREATE TABLE addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type address_type NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Nigeria',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (updated with brand_id)
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    sku TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    track_inventory BOOLEAN DEFAULT TRUE,
    inventory_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    weight DECIMAL(8,2),
    dimensions TEXT,
    material TEXT,
    care_instructions TEXT,
    images TEXT[] DEFAULT '{}',
    featured_image TEXT,
    seo_title TEXT,
    seo_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants table
CREATE TABLE product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    inventory_quantity INTEGER DEFAULT 0,
    size TEXT,
    color TEXT,
    material TEXT,
    weight DECIMAL(8,2),
    dimensions TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carts table
CREATE TABLE carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id TEXT,
    items JSONB DEFAULT '[]',
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id),
    email TEXT NOT NULL,
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_method TEXT,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'NGN',
    shipping_address JSONB,
    billing_address JSONB,
    tracking_number TEXT,
    notes TEXT,
    delivery_method TEXT DEFAULT 'shipping',
    pickup_date DATE,
    pickup_time TEXT,
    customer_phone TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    title TEXT NOT NULL,
    variant_title TEXT,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotions table (updated with brand_id)
CREATE TABLE promotions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_percent INTEGER NOT NULL,
    usage_limit INTEGER DEFAULT -1,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Filter Management Tables
-- ========================

-- Filter categories (sizes, materials, colors, etc.)
CREATE TABLE IF NOT EXISTS filter_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL UNIQUE, -- 'size', 'material', 'color', 'category', 'feature'
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Filter options (XS, S, M, L, XL, etc.)
CREATE TABLE IF NOT EXISTS filter_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES filter_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  value VARCHAR(100) NOT NULL, -- For colors: hex code, for sizes: size code
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product filter assignments
CREATE TABLE IF NOT EXISTS product_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  filter_option_id UUID REFERENCES filter_options(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, filter_option_id)
);

-- Insert default filter categories
INSERT INTO filter_categories (name, type, description, sort_order) VALUES
('Sizes', 'size', 'Product sizes like XS, S, M, L, XL', 1),
('Materials', 'material', 'Fabric materials like Cotton, Silk, Polyester', 2),
('Colors', 'color', 'Product colors', 3),
('Categories', 'category', 'Product categories like Dresses, Tops, Bottoms', 4),
('Features', 'feature', 'Product features like New, Best Seller, Sale', 5)
ON CONFLICT (type) DO NOTHING;

-- Insert default filter options
INSERT INTO filter_options (category_id, name, value, sort_order) VALUES
-- Sizes
((SELECT id FROM filter_categories WHERE type = 'size'), 'Extra Small', 'XS', 1),
((SELECT id FROM filter_categories WHERE type = 'size'), 'Small', 'S', 2),
((SELECT id FROM filter_categories WHERE type = 'size'), 'Medium', 'M', 3),
((SELECT id FROM filter_categories WHERE type = 'size'), 'Large', 'L', 4),
((SELECT id FROM filter_categories WHERE type = 'size'), 'Extra Large', 'XL', 5),
((SELECT id FROM filter_categories WHERE type = 'size'), 'Double Extra Large', 'XXL', 6),

-- Materials
((SELECT id FROM filter_categories WHERE type = 'material'), 'Cotton', 'cotton', 1),
((SELECT id FROM filter_categories WHERE type = 'material'), 'Silk', 'silk', 2),
((SELECT id FROM filter_categories WHERE type = 'material'), 'Polyester', 'polyester', 3),
((SELECT id FROM filter_categories WHERE type = 'material'), 'Linen', 'linen', 4),
((SELECT id FROM filter_categories WHERE type = 'material'), 'Wool', 'wool', 5),
((SELECT id FROM filter_categories WHERE type = 'material'), 'Denim', 'denim', 6),

-- Colors
((SELECT id FROM filter_categories WHERE type = 'color'), 'White', '#FFFFFF', 1),
((SELECT id FROM filter_categories WHERE type = 'color'), 'Black', '#000000', 2),
((SELECT id FROM filter_categories WHERE type = 'color'), 'Red', '#FF0000', 3),
((SELECT id FROM filter_categories WHERE type = 'color'), 'Blue', '#0000FF', 4),
((SELECT id FROM filter_categories WHERE type = 'color'), 'Green', '#008000', 5),
((SELECT id FROM filter_categories WHERE type = 'color'), 'Yellow', '#FFFF00', 6),
((SELECT id FROM filter_categories WHERE type = 'color'), 'Purple', '#800080', 7),
((SELECT id FROM filter_categories WHERE type = 'color'), 'Pink', '#FFC0CB', 8),
((SELECT id FROM filter_categories WHERE type = 'color'), 'Orange', '#FFA500', 9),
((SELECT id FROM filter_categories WHERE type = 'color'), 'Gray', '#808080', 10),

-- Categories
((SELECT id FROM filter_categories WHERE type = 'category'), 'Dresses', 'dresses', 1),
((SELECT id FROM filter_categories WHERE type = 'category'), 'Tops', 'tops', 2),
((SELECT id FROM filter_categories WHERE type = 'category'), 'Bottoms', 'bottoms', 3),
((SELECT id FROM filter_categories WHERE type = 'category'), 'Accessories', 'accessories', 4),
((SELECT id FROM filter_categories WHERE type = 'category'), 'Shoes', 'shoes', 5),
((SELECT id FROM filter_categories WHERE type = 'category'), 'Bags', 'bags', 6),

-- Features
((SELECT id FROM filter_categories WHERE type = 'feature'), 'New Arrival', 'new', 1),
((SELECT id FROM filter_categories WHERE type = 'feature'), 'Best Seller', 'best_seller', 2),
((SELECT id FROM filter_categories WHERE type = 'feature'), 'Sale', 'sale', 3),
((SELECT id FROM filter_categories WHERE type = 'feature'), 'Featured', 'featured', 4),
((SELECT id FROM filter_categories WHERE type = 'feature'), 'Limited Edition', 'limited', 5);

-- Create indexes for better performance
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_promotions_brand_id ON promotions(brand_id);
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_is_active ON brands(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for addresses
CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for brands (public read, admin write)
CREATE POLICY "Anyone can view active brands" ON brands FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage brands" ON brands FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- RLS Policies for product_variants (public read, admin write)
CREATE POLICY "Anyone can view active product variants" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage product variants" ON product_variants FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- RLS Policies for carts
CREATE POLICY "Users can view own cart" ON carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart" ON carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON carts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart" ON carts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- RLS Policies for promotions (public read, admin write)
CREATE POLICY "Anyone can view active promotions" ON promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage promotions" ON promotions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- RLS Policies for filter tables
ALTER TABLE filter_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_filters ENABLE ROW LEVEL SECURITY;

-- Filter categories policies
CREATE POLICY "Allow read access to filter categories" ON filter_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow admin access to filter categories" ON filter_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Filter options policies
CREATE POLICY "Allow read access to filter options" ON filter_options
  FOR SELECT USING (true);

CREATE POLICY "Allow admin access to filter options" ON filter_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Product filters policies
CREATE POLICY "Allow read access to product filters" ON product_filters
  FOR SELECT USING (true);

CREATE POLICY "Allow admin access to product filters" ON product_filters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert default brands
INSERT INTO brands (name, slug, description, primary_color, secondary_color, accent_color, sort_order) VALUES
('Kiowa', 'kiowa', 'Premium fashion brand for the modern woman', '#F59E0B', '#EA580C', '#3B82F6', 1),
('OmegeByIfy', 'omegebyify', 'Contemporary streetwear and urban fashion', '#EF4444', '#F97316', '#8B5CF6', 2),
('MiniMe', 'minime', 'Kids fashion and accessories', '#10B981', '#059669', '#06B6D4', 3);

-- Create a view for products with brand information
CREATE VIEW products_with_brands AS
SELECT 
    p.*,
    b.name as brand_name,
    b.slug as brand_slug,
    b.primary_color as brand_primary_color,
    b.secondary_color as brand_secondary_color,
    b.accent_color as brand_accent_color
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.is_active = true AND b.is_active = true; 