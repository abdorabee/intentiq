alter table public.users
  add column if not exists onboarding_completed_version integer not null default 0
    check (onboarding_completed_version >= 0);

update public.users
set
  onboarding_completed_at = coalesce(onboarding_completed_at, created_at),
  onboarding_completed_version = 1
where onboarding_completed = true;
