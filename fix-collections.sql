-- Fix Featured Collections: Make them active
-- Run this in your Supabase SQL Editor

-- First, let's see the current state
SELECT 
    id, 
    name, 
    is_featured, 
    is_active,
    sort_order 
FROM collections 
ORDER BY sort_order;

-- Update all featured collections to be active
UPDATE collections 
SET is_active = true, updated_at = NOW()
WHERE is_featured = true;

-- Verify the fix
SELECT 
    id, 
    name, 
    is_featured, 
    is_active,
    sort_order 
FROM collections 
WHERE is_featured = true
ORDER BY sort_order; 