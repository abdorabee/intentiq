-- Add richer AI reasoning columns to scores table
alter table public.scores
  add column if not exists buying_stage  text,
  add column if not exists urgency       text,
  add column if not exists key_triggers  jsonb,
  add column if not exists why_now       text,
  add column if not exists email_subject text,
  add column if not exists talk_track    text;
