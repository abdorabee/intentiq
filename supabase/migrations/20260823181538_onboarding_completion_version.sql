alter table public.users
  add column if not exists onboarding_completed_version integer not null default 0
    check (onboarding_completed_version >= 0);

update public.users
set
  onboarding_completed_at = null,
  onboarding_completed_version = 0
where onboarding_completed = false;

update public.users
set
  onboarding_completed_at = coalesce(onboarding_completed_at, created_at),
  onboarding_completed_version = greatest(onboarding_completed_version, 1)
where onboarding_completed = true;

alter table public.users
  drop constraint if exists users_onboarding_completion_tuple_check;

alter table public.users
  add constraint users_onboarding_completion_tuple_check check (
    (
      onboarding_completed = false
      and onboarding_completed_at is null
      and onboarding_completed_version = 0
    )
    or
    (
      onboarding_completed = true
      and onboarding_completed_at is not null
      and onboarding_completed_version >= 1
    )
  );

alter table public.user_preferences
  add column if not exists onboarding_revision bigint not null default 0
    check (onboarding_revision >= 0);

create or replace function public.save_onboarding_progress(
  p_user_id text,
  p_step integer,
  p_draft jsonb,
  p_version integer,
  p_revision bigint
)
returns table (
  user_id text,
  onboarding_step integer,
  onboarding_draft jsonb,
  onboarding_version integer,
  onboarding_revision bigint,
  updated_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  insert into public.user_preferences (
    user_id,
    onboarding_step,
    onboarding_draft,
    onboarding_version,
    onboarding_revision,
    updated_at
  )
  values (
    p_user_id,
    p_step,
    p_draft,
    p_version,
    p_revision,
    now()
  )
  on conflict (user_id) do update
  set
    onboarding_step = excluded.onboarding_step,
    onboarding_draft = excluded.onboarding_draft,
    onboarding_version = excluded.onboarding_version,
    onboarding_revision = excluded.onboarding_revision,
    updated_at = excluded.updated_at
  where user_preferences.onboarding_revision < excluded.onboarding_revision
  returning
    user_preferences.user_id,
    user_preferences.onboarding_step,
    user_preferences.onboarding_draft,
    user_preferences.onboarding_version,
    user_preferences.onboarding_revision,
    user_preferences.updated_at;
$$;

revoke all on function public.save_onboarding_progress(text, integer, jsonb, integer, bigint)
  from public, anon, authenticated;
grant execute on function public.save_onboarding_progress(text, integer, jsonb, integer, bigint)
  to service_role;
