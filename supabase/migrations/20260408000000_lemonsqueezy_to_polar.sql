-- Migrate billing identifiers from LemonSqueezy to Polar.sh

-- Rename billing identifier columns
ALTER TABLE public.users RENAME COLUMN lemon_customer_id TO polar_customer_id;
ALTER TABLE public.users RENAME COLUMN lemon_subscription_id TO polar_subscription_id;

-- Add the increment_credits RPC that was referenced in the webhook but never defined.
-- Adds p_amount to credits_remaining for the given user.
CREATE OR REPLACE FUNCTION public.increment_credits(
  p_user_id TEXT,
  p_amount  NUMERIC
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users
  SET credits_remaining = credits_remaining + p_amount
  WHERE id = p_user_id;
END;
$$;
