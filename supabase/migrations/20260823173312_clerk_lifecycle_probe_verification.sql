create table public.clerk_lifecycle_contract_verifications (
  contract_version text primary key,
  probe_user_id text not null,
  update_event_id text not null,
  update_verified_at timestamptz not null,
  delete_event_id text,
  delete_verified_at timestamptz,
  activated_at timestamptz,
  constraint clerk_lifecycle_delete_evidence_complete check (
    (delete_event_id is null and delete_verified_at is null and activated_at is null)
    or (delete_event_id is not null and delete_verified_at is not null and activated_at is not null)
  )
);

alter table public.clerk_lifecycle_contract_verifications enable row level security;
revoke all on table public.clerk_lifecycle_contract_verifications from anon, authenticated;
grant select, insert, update on table public.clerk_lifecycle_contract_verifications to service_role;

create function public.process_clerk_user_lifecycle_event_v2(
  p_event_id text,
  p_event_type text,
  p_user_id text,
  p_email text,
  p_probe_user_id text,
  p_probe_contract_version text
) returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
  deleted_count integer;
  activated_count integer;
  supported_contract constant text := 'vesperwise-clerk-lifecycle-v1';
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

    if p_probe_contract_version = supported_contract
       and nullif(btrim(p_probe_user_id), '') = p_user_id then
      insert into public.clerk_lifecycle_contract_verifications (
        contract_version,
        probe_user_id,
        update_event_id,
        update_verified_at
      ) values (
        supported_contract,
        p_user_id,
        p_event_id,
        clock_timestamp()
      )
      on conflict (contract_version) do nothing;
    end if;
  else
    -- This guard covers the ownership convention used by this repository:
    -- direct public-table user_id columns. It is not universal ownership discovery.
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
    get diagnostics deleted_count = row_count;

    if p_probe_contract_version = supported_contract
       and nullif(btrim(p_probe_user_id), '') = p_user_id then
      if deleted_count <> 1 then raise exception 'CLERK_PROBE_USER_NOT_FOUND'; end if;
      update public.clerk_lifecycle_contract_verifications
      set delete_event_id = p_event_id,
          delete_verified_at = clock_timestamp(),
          activated_at = clock_timestamp()
      where contract_version = supported_contract
        and probe_user_id = p_user_id
        and delete_event_id is null
        and activated_at is null;
      get diagnostics activated_count = row_count;
      if activated_count <> 1 then raise exception 'CLERK_PROBE_UPDATE_NOT_VERIFIED'; end if;
    end if;
  end if;

  return 'processed';
end;
$$;

revoke execute on function public.process_clerk_user_lifecycle_event_v2(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.process_clerk_user_lifecycle_event_v2(text, text, text, text, text, text) to service_role;

-- The v1 entry point cannot produce database-backed readiness evidence.
revoke execute on function public.process_clerk_user_lifecycle_event(text, text, text, text) from service_role;
