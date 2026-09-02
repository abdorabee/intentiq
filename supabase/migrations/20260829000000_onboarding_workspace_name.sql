-- Adds a persisted, editable workspace display name captured on the first
-- screen of the redesigned onboarding flow. Nullable and unused until a user
-- completes that screen; no backfill needed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_name text;
