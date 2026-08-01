-- Five-signal scoring policies, immutable outcome feedback, and bounded
-- first-party web-change enrichment.

create table if not exists public.scoring_policies (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references public.users(id) on delete cascade,
  name        text not null,
  version     text not null,
  icp_key     text,
  vertical    text,
  policy      jsonb not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint scoring_policies_scope_check
    check (user_id is not null or icp_key is null)
);

create index if not exists scoring_policies_resolution_idx
  on public.scoring_policies (user_id, icp_key, vertical, active, created_at desc);

alter table public.scoring_policies enable row level security;
drop policy if exists "scoring policies: read applicable" on public.scoring_policies;
create policy "scoring policies: read applicable" on public.scoring_policies
  for select using (user_id is null or auth.uid()::text = user_id);
drop policy if exists "scoring policies: manage own" on public.scoring_policies;
create policy "scoring policies: manage own" on public.scoring_policies
  for all using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

insert into public.scoring_policies (
  id,
  user_id,
  name,
  version,
  policy,
  active
) values (
  '00000000-0000-4000-8000-000000000003',
  null,
  'Default five-signal readiness',
  'v3-five-signal-2026-07',
  '{
    "id": "default-v3",
    "version": "v3-five-signal-2026-07",
    "weights": {
      "funding": 25,
      "hiring": 25,
      "news": 20,
      "technology": 20,
      "web_activity": 10
    },
    "halfLivesDays": {
      "funding": 180,
      "hiring": 45,
      "news": 30,
      "technology": 90,
      "web_activity": 14
    },
    "minimumCoverage": 0.75,
    "minimumSignalEquivalent": 4,
    "vertical": null,
    "icpKey": null
  }'::jsonb,
  true
)
on conflict (id) do nothing;

alter table public.scores
  add column if not exists scoring_policy_id text,
  add column if not exists scoring_policy jsonb,
  add column if not exists signal_coverage numeric check (signal_coverage between 0 and 5);

create table if not exists public.score_shadow_results (
  id                 uuid primary key default gen_random_uuid(),
  score_run_id       uuid not null references public.score_runs(id) on delete cascade,
  user_id            text not null references public.users(id) on delete cascade,
  canonical_domain   text not null,
  scoring_version    text not null,
  scoring_policy_id  text,
  score_status       text not null
                       check (score_status in ('complete', 'partial', 'unscorable')),
  score              integer check (score is null or score between 0 and 100),
  data_coverage      numeric not null check (data_coverage between 0 and 1),
  signal_coverage    numeric check (signal_coverage between 0 and 5),
  contributions      jsonb not null default '[]'::jsonb,
  result             jsonb not null,
  created_at         timestamptz not null default now(),
  constraint score_shadow_results_run_version_unique
    unique (score_run_id, scoring_version)
);

create index if not exists score_shadow_results_analysis_idx
  on public.score_shadow_results (user_id, scoring_version, created_at desc);

alter table public.score_shadow_results enable row level security;
drop policy if exists "score shadow results: own rows" on public.score_shadow_results;
create policy "score shadow results: own rows" on public.score_shadow_results
  for select using (auth.uid()::text = user_id);

create table if not exists public.score_outcomes (
  id           uuid primary key default gen_random_uuid(),
  score_id     uuid not null references public.scores(id) on delete cascade,
  user_id      text not null references public.users(id) on delete cascade,
  domain       text not null,
  outcome      text not null
                 check (outcome in ('closed_won', 'closed_lost', 'no_decision', 'disqualified')),
  occurred_at  timestamptz not null default now(),
  value        numeric check (value is null or value >= 0),
  reason       text,
  source       text not null default 'manual'
                 check (source in ('manual', 'crm_import', 'api')),
  actor_id     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint score_outcomes_score_unique unique (score_id)
);

create index if not exists score_outcomes_analysis_idx
  on public.score_outcomes (user_id, outcome, occurred_at desc);

alter table public.score_outcomes enable row level security;
drop policy if exists "score outcomes: own rows" on public.score_outcomes;
create policy "score outcomes: own rows" on public.score_outcomes
  for all using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create table if not exists public.web_enrichment_maps (
  canonical_domain text primary key,
  links             jsonb not null default '[]'::jsonb,
  fetched_at        timestamptz not null,
  updated_at        timestamptz not null default now()
);

alter table public.web_enrichment_maps enable row level security;

create table if not exists public.web_page_snapshots (
  id                uuid primary key default gen_random_uuid(),
  canonical_domain  text not null,
  source_url        text not null,
  content_hash      text not null,
  token_hashes      text[] not null default '{}'::text[],
  content_length    integer not null check (content_length >= 0),
  page_title        text,
  fetched_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint web_page_snapshots_domain_url_unique
    unique (canonical_domain, source_url)
);

create index if not exists web_page_snapshots_domain_fetched_idx
  on public.web_page_snapshots (canonical_domain, fetched_at desc);

alter table public.web_page_snapshots enable row level security;

create table if not exists public.web_enrichment_runs (
  job_id            text primary key,
  canonical_domain  text not null,
  status            text not null
                      check (status in ('running', 'completed', 'failed', 'budget_skipped')),
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  duration_ms       integer check (duration_ms is null or duration_ms >= 0),
  candidate_count   integer not null default 0 check (candidate_count >= 0),
  page_count        integer not null default 0 check (page_count >= 0),
  provider_credits  integer not null default 0 check (provider_credits >= 0),
  attempts          integer not null default 1 check (attempts >= 0),
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists web_enrichment_runs_budget_idx
  on public.web_enrichment_runs (started_at desc, status);
create index if not exists web_enrichment_runs_domain_idx
  on public.web_enrichment_runs (canonical_domain, started_at desc);

alter table public.web_enrichment_runs enable row level security;

-- The existing completion RPC already persists the complete result JSON on
-- score_runs. Copy v3 audit fields into the user-facing scores projection in
-- the same transaction after completion.
create or replace function public.enforce_scoring_v3_shadow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.scoring_version = 'v3-five-signal-2026-07' then
    new.automation_eligible := false;
    if new.result is not null then
      new.result := jsonb_set(new.result, '{automation_eligible}', 'false'::jsonb, true);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists score_runs_enforce_scoring_v3_shadow on public.score_runs;
create trigger score_runs_enforce_scoring_v3_shadow
  before update of status, result, automation_eligible on public.score_runs
  for each row execute function public.enforce_scoring_v3_shadow();

create or replace function public.sync_scoring_v3_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed'
    and new.score_id is not null
    and new.result is not null then
    update public.scores
    set
      scoring_policy_id = new.result ->> 'scoring_policy_id',
      scoring_policy = new.result -> 'scoring_policy',
      signal_coverage = nullif(new.result ->> 'signal_coverage', '')::numeric,
      automation_eligible = case
        when new.scoring_version = 'v3-five-signal-2026-07' then false
        else automation_eligible
      end
    where id = new.score_id;
  end if;
  return new;
end;
$$;

drop trigger if exists score_runs_sync_scoring_v3_metadata on public.score_runs;
create trigger score_runs_sync_scoring_v3_metadata
  after update of status, result, score_id on public.score_runs
  for each row execute function public.sync_scoring_v3_metadata();

revoke all on table public.web_enrichment_maps from anon, authenticated;
revoke all on table public.web_page_snapshots from anon, authenticated;
revoke all on table public.web_enrichment_runs from anon, authenticated;
grant all on table public.web_enrichment_maps to service_role;
grant all on table public.web_page_snapshots to service_role;
grant all on table public.web_enrichment_runs to service_role;
