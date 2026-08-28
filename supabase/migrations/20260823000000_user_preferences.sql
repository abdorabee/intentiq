-- User UI preferences for theme and product tour state.
-- App reads/writes this column via /api/user/preferences; defaults are applied in code.
alter table public.users
  add column if not exists preferences jsonb not null default '{}'::jsonb;

comment on column public.users.preferences is
  'User UI preferences: { theme, product_tour_completed, product_tour_version }';
