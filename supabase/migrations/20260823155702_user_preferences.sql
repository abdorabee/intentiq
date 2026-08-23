alter table public.users
  add column if not exists onboarding_completed_at timestamptz;

create table public.user_preferences (
  user_id text primary key references public.users(id) on delete cascade,
  theme text not null default 'system'
    check (theme in ('system', 'light', 'dark')),
  sidebar_collapsed boolean not null default false,
  analytics_enabled boolean not null default true,
  onboarding_version integer not null default 0
    check (onboarding_version >= 0),
  onboarding_step integer not null default 0
    check (onboarding_step >= 0),
  onboarding_draft jsonb not null default '{}'::jsonb
    check (jsonb_typeof(onboarding_draft) = 'object'),
  tour_version integer not null default 0
    check (tour_version >= 0),
  tour_status text not null default 'not_started'
    check (tour_status in ('not_started', 'in_progress', 'completed', 'dismissed')),
  tour_step integer not null default 0
    check (tour_step >= 0),
  tour_updated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

revoke all on table public.user_preferences from anon, authenticated;
grant select, insert, update on table public.user_preferences to service_role;

create function public.set_user_preferences_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_user_preferences_updated_at();
