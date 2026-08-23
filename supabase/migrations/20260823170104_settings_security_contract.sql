create table public.clerk_webhook_events (
  event_id text primary key,
  event_type text not null check (event_type in ('user.updated', 'user.deleted')),
  processed_at timestamptz not null default now()
);

alter table public.clerk_webhook_events enable row level security;
revoke all on table public.clerk_webhook_events from anon, authenticated;
grant select, insert on table public.clerk_webhook_events to service_role;

create function public.process_clerk_user_lifecycle_event(
  p_event_id text,
  p_event_type text,
  p_user_id text,
  p_email text default null
) returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if nullif(btrim(p_event_id), '') is null or nullif(btrim(p_user_id), '') is null then
    raise exception 'INVALID_CLERK_LIFECYCLE_EVENT';
  end if;
  if p_event_type not in ('user.updated', 'user.deleted') then
    raise exception 'UNSUPPORTED_CLERK_LIFECYCLE_EVENT';
  end if;

  insert into public.clerk_webhook_events (event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return 'duplicate'; end if;

  if p_event_type = 'user.updated' then
    if nullif(btrim(p_email), '') is null then raise exception 'PRIMARY_EMAIL_REQUIRED'; end if;
    update public.users set email = p_email where id = p_user_id;
    if not found then raise exception 'CLERK_USER_NOT_FOUND'; end if;
  else
    if exists (
      select 1
      from pg_catalog.pg_class owned_table
      join pg_catalog.pg_namespace owned_schema on owned_schema.oid = owned_table.relnamespace
      join pg_catalog.pg_attribute owner_column on owner_column.attrelid = owned_table.oid
      where owned_schema.nspname = 'public'
        and owned_table.relkind in ('r', 'p')
        and owner_column.attname = 'user_id'
        and owner_column.attnum > 0
        and not owner_column.attisdropped
        and not exists (
          select 1
          from pg_catalog.pg_constraint owner_fk
          where owner_fk.conrelid = owned_table.oid
            and owner_fk.contype = 'f'
            and owner_fk.confrelid = 'public.users'::pg_catalog.regclass
            and owner_fk.confdeltype = 'c'
            and owner_column.attnum = any(owner_fk.conkey)
        )
    ) then
      raise exception 'CLERK_USER_CASCADE_CONTRACT_UNVERIFIED';
    end if;
    delete from public.users where id = p_user_id;
  end if;
  return 'processed';
end;
$$;

revoke execute on function public.process_clerk_user_lifecycle_event(text, text, text, text) from public, anon, authenticated;
grant execute on function public.process_clerk_user_lifecycle_event(text, text, text, text) to service_role;

create function public.create_api_key_atomic(
  p_user_id text,
  p_key_hash text,
  p_label text
) returns table (
  id uuid,
  user_id text,
  label text,
  last_used timestamptz,
  is_active boolean,
  created_at timestamptz,
  plan_limit integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_plan text;
  active_limit integer;
  active_count integer;
  created public.api_keys%rowtype;
begin
  if nullif(btrim(p_user_id), '') is null or nullif(btrim(p_key_hash), '') is null
     or char_length(btrim(p_label)) not between 1 and 48 then
    raise exception 'INVALID_API_KEY_INPUT';
  end if;

  select u.plan into owner_plan from public.users u where u.id = p_user_id for update;
  if not found then raise exception 'API_KEY_OWNER_NOT_FOUND'; end if;

  active_limit := case owner_plan
    when 'free' then 1 when 'starter' then 2 when 'growth' then 5
    when 'pro' then 10 when 'agency' then 25 else 0 end;
  select count(*)::integer into active_count from public.api_keys k
  where k.user_id = p_user_id and k.is_active = true;
  if active_count >= active_limit then raise exception 'API_KEY_LIMIT_REACHED'; end if;

  insert into public.api_keys (user_id, key_hash, label)
  values (p_user_id, p_key_hash, btrim(p_label)) returning * into created;

  id := created.id;
  user_id := created.user_id;
  label := created.label;
  last_used := created.last_used;
  is_active := created.is_active;
  created_at := created.created_at;
  plan_limit := active_limit;
  return next;
end;
$$;

revoke execute on function public.create_api_key_atomic(text, text, text) from public, anon, authenticated;
grant execute on function public.create_api_key_atomic(text, text, text) to service_role;
