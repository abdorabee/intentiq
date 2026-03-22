-- Replace Stripe with LemonSqueezy
ALTER TABLE public.users RENAME COLUMN stripe_customer_id TO lemon_customer_id;
ALTER TABLE public.users ADD COLUMN lemon_subscription_id text;
