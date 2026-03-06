-- ─── Users ────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  stripe_customer_id text,
  plan              text not null default 'free'
                      check (plan in ('free','starter','growth','pro','agency')),
  credits_remaining integer not null default 20,
  product_category  text,
  created_at        timestamptz not null default now()
);

alter table public.users enable row level security;
create policy "users: own row" on public.users
  for all using (auth.uid() = id);

-- ─── API Keys ─────────────────────────────────────────────────────────────────
create table if not exists public.api_keys (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  key_hash   text not null unique,
  label      text not null default 'Default',
  last_used  timestamptz,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.api_keys enable row level security;
create policy "api_keys: own rows" on public.api_keys
  for all using (auth.uid() = user_id);

-- ─── Scores ───────────────────────────────────────────────────────────────────
create table if not exists public.scores (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  domain             text not null,
  company_name       text not null,
  score              integer not null,
  score_band         text not null check (score_band in ('HOT','WARM','COLD')),
  signals            jsonb not null,
  ai_summary         text not null,
  recommended_action text not null,
  expires_at         timestamptz not null,
  created_at         timestamptz not null default now()
);

create index on public.scores (user_id, created_at desc);
create index on public.scores (domain, created_at desc);

alter table public.scores enable row level security;
create policy "scores: own rows" on public.scores
  for all using (auth.uid() = user_id);

-- ─── Watchlist ────────────────────────────────────────────────────────────────
create table if not exists public.watchlist (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  domain       text not null,
  company_name text not null,
  last_scored  timestamptz,
  score        integer,
  score_band   text check (score_band in ('HOT','WARM','COLD')),
  is_active    boolean not null default true,
  unique (user_id, domain)
);

create index on public.watchlist (user_id, score desc);

alter table public.watchlist enable row level security;
create policy "watchlist: own rows" on public.watchlist
  for all using (auth.uid() = user_id);

-- ─── Credits Log ──────────────────────────────────────────────────────────────
create table if not exists public.credits_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  amount     integer not null,
  type       text not null check (type in ('debit','credit')),
  reason     text not null,
  created_at timestamptz not null default now()
);

alter table public.credits_log enable row level security;
create policy "credits_log: own rows" on public.credits_log
  for all using (auth.uid() = user_id);

-- ─── Bulk Jobs ────────────────────────────────────────────────────────────────
create table if not exists public.bulk_jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  status      text not null default 'queued'
                check (status in ('queued','processing','completed','failed')),
  total       integer not null,
  completed   integer not null default 0,
  webhook_url text,
  results     jsonb,
  created_at  timestamptz not null default now()
);

create index on public.bulk_jobs (user_id, status);

alter table public.bulk_jobs enable row level security;
create policy "bulk_jobs: own rows" on public.bulk_jobs
  for all using (auth.uid() = user_id);

-- ─── Credit deduction RPC ─────────────────────────────────────────────────────
create or replace function public.deduct_credit(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.users
  set credits_remaining = credits_remaining - 1
  where id = p_user_id and credits_remaining > 0;

  insert into public.credits_log (user_id, amount, type, reason)
  values (p_user_id, 1, 'debit', 'API score request');
end;
$$;

-- ─── Auto-create user profile on signup ──────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, product_category)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'product_category'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
