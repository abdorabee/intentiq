-- ─── Chat Sessions ──────────────────────────────────────────────────────────
create table if not exists public.chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public.users(id) on delete cascade,
  title      text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.chat_sessions (user_id, updated_at desc);

alter table public.chat_sessions enable row level security;
create policy "chat_sessions: own rows" on public.chat_sessions
  for all using (auth.uid()::text = user_id);

-- ─── Chat Messages ─────────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.chat_sessions(id) on delete cascade,
  role        text not null check (role in ('user','assistant','tool')),
  content     text not null,
  tool_calls  jsonb,
  tool_result jsonb,
  tokens_used integer default 0,
  created_at  timestamptz not null default now()
);

create index on public.chat_messages (session_id, created_at asc);

alter table public.chat_messages enable row level security;
create policy "chat_messages: own rows" on public.chat_messages
  for all using (
    exists (
      select 1 from public.chat_sessions cs
      where cs.id = session_id and cs.user_id = auth.uid()::text
    )
  );

-- ─── User role ──────────────────────────────────────────────────────────────
alter table public.users
  add column if not exists role text not null default 'sdr'
    check (role in ('sdr','ae','manager','admin'));

-- ─── Fractional credits ─────────────────────────────────────────────────────
alter table public.users alter column credits_remaining type numeric(10,2);
alter table public.credits_log alter column amount type numeric(10,2);

-- ─── Pipeline stages on watchlist ───────────────────────────────────────────
alter table public.watchlist
  add column if not exists pipeline_stage text not null default 'cold'
    check (pipeline_stage in ('cold','warming','hot','engaged','converted'));
alter table public.watchlist
  add column if not exists stage_changed_at timestamptz not null default now();
alter table public.watchlist
  add column if not exists previous_score integer;

-- ─── Fractional credit deduction RPC ────────────────────────────────────────
create or replace function public.deduct_chat_credit(p_user_id text, p_amount numeric)
returns void language plpgsql security definer as $$
begin
  update public.users
  set credits_remaining = credits_remaining - p_amount
  where id = p_user_id and credits_remaining >= p_amount;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credits_log (user_id, amount, type, reason)
  values (p_user_id, p_amount, 'debit', 'Chat message');
end;
$$;
