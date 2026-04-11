-- Add subscription status columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_renews_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

-- Idempotency table for Polar webhook events.
-- Prevents double-processing when Polar retries a slow delivery.
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id         TEXT        PRIMARY KEY,  -- webhook-id header value from Polar
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
