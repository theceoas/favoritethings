-- Migration to remove localStorage and use database-only cart system
-- Run this SQL in your Supabase SQL editor

-- 1. Update carts table to support session-based carts
ALTER TABLE carts 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create cart_sessions table for anonymous users
CREATE TABLE IF NOT EXISTS cart_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- 3. Create user_preferences table to replace localStorage preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id TEXT, -- For anonymous users
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_key),
    UNIQUE(session_id, preference_key)
);

-- 4. Create checkout_sessions table to replace sessionStorage
CREATE TABLE IF NOT EXISTS checkout_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    checkout_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_expires_at ON carts(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_session_id ON cart_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_expires_at ON cart_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_session_id ON user_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_session_id ON checkout_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires_at ON checkout_sessions(expires_at);

-- 6. Create RLS policies
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Cart sessions policies
CREATE POLICY "Users can view their own cart sessions" ON cart_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

CREATE POLICY "Users can insert their own cart sessions" ON cart_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

CREATE POLICY "Users can update their own cart sessions" ON cart_sessions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

CREATE POLICY "Users can delete their own cart sessions" ON cart_sessions
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

-- Checkout sessions policies
CREATE POLICY "Users can view their own checkout sessions" ON checkout_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

CREATE POLICY "Users can insert their own checkout sessions" ON checkout_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

CREATE POLICY "Users can update their own checkout sessions" ON checkout_sessions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

CREATE POLICY "Users can delete their own checkout sessions" ON checkout_sessions
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    );

-- 7. Create functions for cart management
CREATE OR REPLACE FUNCTION get_or_create_cart(
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    cart_uuid UUID;
BEGIN
    -- Try to find existing cart
    IF p_user_id IS NOT NULL THEN
        SELECT id INTO cart_uuid FROM carts 
        WHERE user_id = p_user_id 
        ORDER BY created_at DESC 
        LIMIT 1;
    ELSIF p_session_id IS NOT NULL THEN
        SELECT id INTO cart_uuid FROM carts 
        WHERE session_id = p_session_id 
        ORDER BY created_at DESC 
        LIMIT 1;
    END IF;
    
    -- Create new cart if none found
    IF cart_uuid IS NULL THEN
        INSERT INTO carts (user_id, session_id, items, subtotal, tax_amount, total)
        VALUES (p_user_id, p_session_id, '[]'::jsonb, 0, 0, 0)
        RETURNING id INTO cart_uuid;
    END IF;
    
    -- Update last accessed time
    UPDATE carts SET last_accessed_at = NOW() WHERE id = cart_uuid;
    
    RETURN cart_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to clean up expired carts
CREATE OR REPLACE FUNCTION cleanup_expired_carts() RETURNS void AS $$
BEGIN
    DELETE FROM carts WHERE expires_at < NOW();
    DELETE FROM cart_sessions WHERE expires_at < NOW();
    DELETE FROM checkout_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_sessions_updated_at 
    BEFORE UPDATE ON cart_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkout_sessions_updated_at 
    BEFORE UPDATE ON checkout_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON cart_sessions TO anon, authenticated;
GRANT ALL ON user_preferences TO anon, authenticated;
GRANT ALL ON checkout_sessions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_cart TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_carts TO anon, authenticated;

-- 11. Create a view for easy cart access
CREATE OR REPLACE VIEW user_carts AS
SELECT 
    c.*,
    cs.session_id as cart_session_id
FROM carts c
LEFT JOIN cart_sessions cs ON c.id = cs.cart_id
WHERE c.expires_at > NOW();

-- Grant access to the view
GRANT SELECT ON user_carts TO anon, authenticated;

COMMENT ON TABLE cart_sessions IS 'Manages cart sessions for anonymous and authenticated users';
COMMENT ON TABLE user_preferences IS 'Stores user preferences that were previously in localStorage';
COMMENT ON TABLE checkout_sessions IS 'Stores checkout session data that was previously in sessionStorage';
COMMENT ON FUNCTION get_or_create_cart IS 'Gets existing cart or creates new one for user/session';
COMMENT ON FUNCTION cleanup_expired_carts IS 'Cleans up expired carts and sessions';
