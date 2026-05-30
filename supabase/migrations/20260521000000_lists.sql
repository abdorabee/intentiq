-- ─── Lists ────────────────────────────────────────────────────────────────────
create table if not exists public.lists (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null references public.users(id) on delete cascade,
  name           text not null,
  description    text,
  list_type      text not null check (list_type in ('manual', 'smart')),
  color          text not null default '#7170ff',
  icon_initials  text,
  rules          jsonb,
  auto_refresh   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists lists_user_updated_idx on public.lists (user_id, updated_at desc);

alter table public.lists enable row level security;
create policy "lists: own rows" on public.lists
  for all using (auth.uid()::text = user_id);

-- ─── List members (manual lists) ─────────────────────────────────────────────
create table if not exists public.list_members (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references public.lists(id) on delete cascade,
  user_id      text not null references public.users(id) on delete cascade,
  domain       text not null,
  company_name text not null,
  added_at     timestamptz not null default now(),
  unique (list_id, domain)
);

create index if not exists list_members_list_idx on public.list_members (list_id);
create index if not exists list_members_user_domain_idx on public.list_members (user_id, domain);

alter table public.list_members enable row level security;
create policy "list_members: own rows" on public.list_members
  for all using (auth.uid()::text = user_id);

-- Backfill: one manual "My Watchlist" list per user with existing watchlist rows
insert into public.lists (user_id, name, description, list_type, color, icon_initials)
select distinct w.user_id,
  'My Watchlist',
  'Accounts from your watchlist',
  'manual',
  '#4ade80',
  'MW'
from public.watchlist w
where w.is_active = true
  and not exists (
    select 1 from public.lists l
    where l.user_id = w.user_id and l.name = 'My Watchlist'
  );

insert into public.list_members (list_id, user_id, domain, company_name, added_at)
select l.id, w.user_id, w.domain, w.company_name, coalesce(w.last_scored, now())
from public.watchlist w
join public.lists l on l.user_id = w.user_id and l.name = 'My Watchlist'
where w.is_active = true
on conflict (list_id, domain) do nothing;
