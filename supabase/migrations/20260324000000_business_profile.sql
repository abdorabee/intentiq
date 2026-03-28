-- Add business profile and onboarding flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_profile jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
