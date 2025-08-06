-- Fix promotion usage tracking to be per-user, not global
-- Run this to check and fix the promotion usage system

-- 1. First, let's check the current record_promotion_usage function
\df record_promotion_usage

-- 2. Check the current promotion_usage table structure
\d promotion_usage

-- 3. Check current promotions and their usage
SELECT 
    code, 
    description, 
    discount_percent,
    usage_limit,
    times_used,
    is_active,
    (SELECT COUNT(*) FROM promotion_usage WHERE promotion_id = promotions.id) as actual_usage_count
FROM promotions 
ORDER BY created_at DESC;

-- 4. Check promotion usage by user
SELECT 
    p.code,
    p.description,
    pu.user_id,
    pr.email,
    pu.used_at,
    pu.order_id
FROM promotion_usage pu
JOIN promotions p ON pu.promotion_id = p.id
LEFT JOIN profiles pr ON pu.user_id = pr.id
ORDER BY pu.used_at DESC;

-- 5. Drop the existing problematic function if it exists
DROP FUNCTION IF EXISTS record_promotion_usage(UUID, UUID, UUID);

-- 6. Create a proper record_promotion_usage function
CREATE OR REPLACE FUNCTION record_promotion_usage(
    p_promotion_id UUID,
    p_user_id UUID,
    p_order_id UUID
) RETURNS VOID AS $$
DECLARE
    current_user_usage_count INTEGER;
    promotion_usage_limit INTEGER;
BEGIN
    -- Get the promotion's usage limit
    SELECT usage_limit INTO promotion_usage_limit 
    FROM promotions 
    WHERE id = p_promotion_id;

    -- Count how many times this user has used this promotion
    SELECT COUNT(*) INTO current_user_usage_count
    FROM promotion_usage 
    WHERE promotion_id = p_promotion_id 
    AND user_id = p_user_id;

    -- Check if user has reached their personal limit
    IF current_user_usage_count >= promotion_usage_limit THEN
        RAISE EXCEPTION 'User has already used this promotion code % time(s) (limit: %)', 
            current_user_usage_count, promotion_usage_limit;
        RETURN;
    END IF;

    -- Record the usage
    INSERT INTO promotion_usage (
        promotion_id,
        user_id,
        order_id,
        used_at
    ) VALUES (
        p_promotion_id,
        p_user_id,
        p_order_id,
        NOW()
    );

    -- Update the global times_used counter (total usage count across all users)
    UPDATE promotions 
    SET times_used = times_used + 1
    WHERE id = p_promotion_id;

    RAISE NOTICE 'Promotion usage recorded for user % and promotion % (usage: %/%)', 
        p_user_id, p_promotion_id, current_user_usage_count + 1, promotion_usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Reset times_used to match actual unique user usage
UPDATE promotions 
SET times_used = (
    SELECT COUNT(DISTINCT user_id) 
    FROM promotion_usage 
    WHERE promotion_id = promotions.id
)
WHERE id IN (
    SELECT DISTINCT promotion_id 
    FROM promotion_usage
);

-- 8. Create test promotions with different per-user usage limits
INSERT INTO promotions (
    code,
    description,
    discount_percent,
    valid_from,
    valid_until,
    is_active,
    usage_limit,
    times_used,
    created_by
) VALUES 
    (
        'ONEUSE',
        'One Use Per User - 25% Off',
        25,
        NOW(),
        NOW() + INTERVAL '30 days',
        true,
        1, -- Each user can use this 1 time
        0,
        (SELECT id FROM auth.users LIMIT 1)
    ),
    (
        'TWOUSE',
        'Two Uses Per User - 15% Off',
        15,
        NOW(),
        NOW() + INTERVAL '30 days',
        true,
        2, -- Each user can use this 2 times
        0,
        (SELECT id FROM auth.users LIMIT 1)
    ),
    (
        'UNLIMITED',
        'Unlimited Uses Per User - 5% Off',
        5,
        NOW(),
        NOW() + INTERVAL '30 days',
        true,
        999, -- Each user can use this 999 times (effectively unlimited)
        0,
        (SELECT id FROM auth.users LIMIT 1)
    )
ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    discount_percent = EXCLUDED.discount_percent,
    valid_from = EXCLUDED.valid_from,
    valid_until = EXCLUDED.valid_until,
    is_active = EXCLUDED.is_active,
    usage_limit = EXCLUDED.usage_limit;

-- 9. Check the results
SELECT 
    'After fix:' as status,
    code, 
    description, 
    usage_limit as per_user_limit,
    times_used as total_times_used,
    (SELECT COUNT(DISTINCT user_id) FROM promotion_usage WHERE promotion_id = promotions.id) as unique_users_used,
    (SELECT COUNT(*) FROM promotion_usage WHERE promotion_id = promotions.id) as total_usage_records
FROM promotions 
WHERE code IN ('ONEUSE', 'TWOUSE', 'UNLIMITED', 'WELCOME10', 'TEST')
ORDER BY created_at DESC;

-- 10. Show explanation of the new system
SELECT 
    '=== NEW PROMOTION SYSTEM EXPLANATION ===' as info,
    'usage_limit = how many times EACH USER can use the code' as rule1,
    'times_used = total uses across ALL USERS' as rule2,
    'Example: ONEUSE with usage_limit=1 means each user can use it once' as example1,
    'If 5 users each use ONEUSE once, times_used=5 but each user used it 1/1 times' as example2;

-- 11. Grant necessary permissions
GRANT EXECUTE ON FUNCTION record_promotion_usage TO authenticated;
GRANT EXECUTE ON FUNCTION record_promotion_usage TO anon; 