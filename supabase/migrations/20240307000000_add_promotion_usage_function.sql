-- Create promotion_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.promotion_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    promotion_id UUID NOT NULL REFERENCES public.promotions(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    used_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(promotion_id, user_id)
);

-- Create function to record promotion usage
CREATE OR REPLACE FUNCTION public.record_promotion_usage(
    p_promotion_id UUID,
    p_user_id UUID,
    p_order_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert usage record
    INSERT INTO public.promotion_usage (promotion_id, user_id, order_id)
    VALUES (p_promotion_id, p_user_id, p_order_id);

    -- Update promotion times_used counter
    UPDATE public.promotions
    SET times_used = times_used + 1
    WHERE id = p_promotion_id;

    -- Note: The UNIQUE constraint on promotion_usage will prevent duplicate usage
    -- If a user tries to use the same promotion twice, it will fail
END;
$$; 