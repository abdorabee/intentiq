-- Add notification preference columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notify_weekly_digest BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_credit_low    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_hot_signal    BOOLEAN NOT NULL DEFAULT true;
