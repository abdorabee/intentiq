-- Migrate from Supabase auth UUIDs to Clerk text IDs.
-- Drops the auth.users FK, changes all user identity columns to text,
-- removes the now-redundant auto-provision trigger, and updates the
-- deduct_credit RPC signature.

-- ─── Drop dependent objects before altering column types ──────────────────────

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop RLS policies (depend on id/user_id columns)
drop policy if exists "users: own row" on public.users;
drop policy if exists "api_keys: own rows" on public.api_keys;
drop policy if exists "scores: own rows" on public.scores;
drop policy if exists "watchlist: own rows" on public.watchlist;
drop policy if exists "credits_log: own rows" on public.credits_log;
drop policy if exists "bulk_jobs: own rows" on public.bulk_jobs;

-- Drop all FK constraints that reference users.id
alter table public.api_keys    drop constraint if exists api_keys_user_id_fkey;
alter table public.scores      drop constraint if exists scores_user_id_fkey;
alter table public.watchlist   drop constraint if exists watchlist_user_id_fkey;
alter table public.credits_log drop constraint if exists credits_log_user_id_fkey;
alter table public.bulk_jobs   drop constraint if exists bulk_jobs_user_id_fkey;

-- Drop the auth.users FK on users.id
alter table public.users drop constraint if exists users_id_fkey;
alter table public.users drop constraint if exists users_pkey;

-- ─── Change users.id to text ──────────────────────────────────────────────────

alter table public.users alter column id type text using id::text;
alter table public.users add primary key (id);

-- ─── Change all user_id columns to text ───────────────────────────────────────

alter table public.api_keys    alter column user_id type text using user_id::text;
alter table public.scores      alter column user_id type text using user_id::text;
alter table public.watchlist   alter column user_id type text using user_id::text;
alter table public.credits_log alter column user_id type text using user_id::text;
alter table public.bulk_jobs   alter column user_id type text using user_id::text;

-- ─── Re-add FK constraints ────────────────────────────────────────────────────

alter table public.api_keys    add constraint api_keys_user_id_fkey    foreign key (user_id) references public.users(id) on delete cascade;
alter table public.scores      add constraint scores_user_id_fkey      foreign key (user_id) references public.users(id) on delete cascade;
alter table public.watchlist   add constraint watchlist_user_id_fkey   foreign key (user_id) references public.users(id) on delete cascade;
alter table public.credits_log add constraint credits_log_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
alter table public.bulk_jobs   add constraint bulk_jobs_user_id_fkey   foreign key (user_id) references public.users(id) on delete cascade;

-- ─── Update deduct_credit RPC ─────────────────────────────────────────────────

drop function if exists public.deduct_credit(uuid);

create or replace function public.deduct_credit(p_user_id text)
returns void language plpgsql security definer as $$
begin
  update public.users
  set credits_remaining = credits_remaining - 1
  where id = p_user_id and credits_remaining > 0;

  insert into public.credits_log (user_id, amount, type, reason)
  values (p_user_id, 1, 'debit', 'API score request');
end;
$$;

-- ─── Recreate RLS policies ────────────────────────────────────────────────────
-- auth.uid() is always null when using Clerk. Policies are inert but document
-- row isolation for direct Supabase access (e.g. Studio).

create policy "users: own row" on public.users for all using (auth.uid()::text = id);
create policy "api_keys: own rows" on public.api_keys for all using (auth.uid()::text = user_id);
create policy "scores: own rows" on public.scores for all using (auth.uid()::text = user_id);
create policy "watchlist: own rows" on public.watchlist for all using (auth.uid()::text = user_id);
create policy "credits_log: own rows" on public.credits_log for all using (auth.uid()::text = user_id);
create policy "bulk_jobs: own rows" on public.bulk_jobs for all using (auth.uid()::text = user_id);
