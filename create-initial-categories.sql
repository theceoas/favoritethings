-- Create initial categories for Bedz&Buttunz
-- These will appear in the dynamic navigation

INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES 
('Bedding Sets', 'bedding-sets', 'Complete bedding sets including duvet covers, sheets, and pillowcases', 1, true),
('Bed Sheets', 'bed-sheets', 'Premium Egyptian cotton bed sheets in various colors and sizes', 2, true),
('Pillows', 'pillows', 'Comfortable pillows for the perfect night''s sleep', 3, true),
('Comforters', 'comforters', 'Luxurious comforters and duvets for year-round comfort', 4, true),
('Throws & Blankets', 'throws-blankets', 'Decorative throws and cozy blankets', 5, true),
('Accessories', 'accessories', 'Bedroom accessories and decor items', 6, true);

-- These categories will now appear in your navigation automatically! 