-- Scoring v2 persistence, evidence, idempotency, and exact-once credit handling.

-- Domain-level evidence is deliberately workspace-neutral. Only service-role
-- callers (the API and background workers) may read or write it.
create table if not exists public.signal_evidence (
  id                uuid primary key default gen_random_uuid(),
  canonical_domain  text not null,
  signal_type       text not null,
  source            text not null,
  schema_version    text not null,
  status            text not null
                      check (status in ('ok', 'no_signal', 'stale', 'not_found', 'unavailable')),
  observed_at       timestamptz,
  fetched_at        timestamptz not null,
  expires_at        timestamptz,
  evidence          jsonb not null default '[]'::jsonb,
  raw_payload       jsonb,
  shadow            boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint signal_evidence_identity_key
    unique (canonical_domain, signal_type, source, schema_version)
);

create index if not exists signal_evidence_domain_fresh_idx
  on public.signal_evidence (canonical_domain, signal_type, expires_at desc)
  where shadow = false;

alter table public.signal_evidence enable row level security;

create table if not exists public.score_runs (
  id                    uuid primary key default gen_random_uuid(),
  user_id               text not null references public.users(id) on delete cascade,
  request_key           text not null,
  request_fingerprint   text not null,
  canonical_domain      text not null,
  company_name          text not null,
  scoring_version       text not null,
  profile_hash          text not null,
  status                text not null default 'running'
                          check (status in ('running', 'completed', 'failed', 'unscorable')),
  score_status          text
                          check (score_status in ('complete', 'partial', 'unscorable')),
  data_coverage         numeric check (data_coverage between 0 and 1),
  is_baseline           boolean not null default false,
  automation_eligible   boolean not null default false,
  source_status         jsonb not null default '{}'::jsonb,
  evidence_ids          uuid[] not null default '{}'::uuid[],
  score_id              uuid,
  result                jsonb,
  charge_required       boolean not null default true,
  credit_reserved       boolean not null default false,
  charged_at            timestamptz,
  failure_code          text,
  failure_message       text,
  cache_expires_at      timestamptz,
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint score_runs_request_key unique (user_id, request_key)
);

create index if not exists score_runs_result_cache_idx
  on public.score_runs (
    user_id,
    canonical_domain,
    profile_hash,
    scoring_version,
    cache_expires_at desc
  )
  where status = 'completed';

create index if not exists score_runs_running_idx
  on public.score_runs (user_id, canonical_domain, profile_hash, scoring_version)
  where status = 'running';

create index if not exists score_runs_stale_reaper_idx
  on public.score_runs (started_at, user_id)
  where status = 'running';

alter table public.score_runs enable row level security;
drop policy if exists "score_runs: own rows" on public.score_runs;
create policy "score_runs: own rows" on public.score_runs
  for all using (auth.uid()::text = user_id);

-- Keep the existing scores table as the user-facing history projection while
-- retaining the v2 metadata needed to reproduce and audit each result.
alter table public.scores
  add column if not exists score_run_id          uuid references public.score_runs(id) on delete set null,
  add column if not exists scoring_version      text not null default 'v1',
  add column if not exists profile_hash         text,
  add column if not exists score_status         text not null default 'complete'
                                                check (score_status in ('complete', 'partial')),
  add column if not exists data_coverage        numeric check (data_coverage between 0 and 1),
  add column if not exists confidence           numeric check (confidence between 0 and 1),
  add column if not exists raw_score            integer,
  add column if not exists icp_fit_score        integer check (icp_fit_score between 0 and 100),
  add column if not exists contributions        jsonb not null default '[]'::jsonb,
  add column if not exists source_status        jsonb not null default '{}'::jsonb,
  add column if not exists is_baseline          boolean not null default false,
  add column if not exists automation_eligible  boolean not null default false,
  add column if not exists evidence_ids         uuid[] not null default '{}'::uuid[],
  add column if not exists model_tier           text,
  add column if not exists model_fallback       boolean not null default false,
  add column if not exists score_explanation    text;

create unique index if not exists scores_score_run_id_key
  on public.scores (score_run_id)
  where score_run_id is not null;

alter table public.score_runs
  drop constraint if exists score_runs_score_id_fkey;
alter table public.score_runs
  add constraint score_runs_score_id_fkey
  foreign key (score_id) references public.scores(id) on delete set null;

alter table public.credits_log
  add column if not exists score_run_id uuid references public.score_runs(id) on delete set null;

create unique index if not exists credits_log_score_run_id_key
  on public.credits_log (score_run_id)
  where score_run_id is not null;

-- Shared helper used by both completion and failure paths so evidence is
-- committed atomically with the terminal run state.
create or replace function public.persist_signal_evidence(p_evidence jsonb)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_id uuid;
  v_ids uuid[] := '{}'::uuid[];
begin
  if jsonb_typeof(coalesce(p_evidence, '[]'::jsonb)) <> 'array' then
    raise exception 'signal evidence must be a JSON array';
  end if;

  for v_item in
    select value from jsonb_array_elements(coalesce(p_evidence, '[]'::jsonb))
  loop
    if nullif(trim(v_item ->> 'canonical_domain'), '') is null
      or nullif(trim(v_item ->> 'signal_type'), '') is null
      or nullif(trim(v_item ->> 'source'), '') is null
      or nullif(trim(v_item ->> 'schema_version'), '') is null then
      raise exception 'signal evidence identity fields are required';
    end if;

    v_id := null;
    insert into public.signal_evidence (
      canonical_domain,
      signal_type,
      source,
      schema_version,
      status,
      observed_at,
      fetched_at,
      expires_at,
      evidence,
      raw_payload,
      shadow
    ) values (
      lower(trim(v_item ->> 'canonical_domain')),
      lower(trim(v_item ->> 'signal_type')),
      lower(trim(v_item ->> 'source')),
      trim(v_item ->> 'schema_version'),
      coalesce(nullif(v_item ->> 'status', ''), 'unavailable'),
      nullif(v_item ->> 'observed_at', '')::timestamptz,
      coalesce(nullif(v_item ->> 'fetched_at', '')::timestamptz, now()),
      nullif(v_item ->> 'expires_at', '')::timestamptz,
      coalesce(v_item -> 'evidence', '[]'::jsonb),
      v_item -> 'raw_payload',
      coalesce((v_item ->> 'shadow')::boolean, false)
    )
    on conflict (canonical_domain, signal_type, source, schema_version)
    do update set
      status = excluded.status,
      observed_at = excluded.observed_at,
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at,
      evidence = excluded.evidence,
      raw_payload = excluded.raw_payload,
      shadow = excluded.shadow,
      updated_at = now()
    where excluded.fetched_at >= public.signal_evidence.fetched_at
      and (
        excluded.status in ('ok', 'no_signal', 'stale')
        or public.signal_evidence.status in ('unavailable', 'not_found')
        or coalesce(public.signal_evidence.expires_at, '-infinity'::timestamptz) <= now()
      )
    returning id into v_id;

    if v_id is null then
      select se.id into v_id
      from public.signal_evidence se
      where se.canonical_domain = lower(trim(v_item ->> 'canonical_domain'))
        and se.signal_type = lower(trim(v_item ->> 'signal_type'))
        and se.source = lower(trim(v_item ->> 'source'))
        and se.schema_version = trim(v_item ->> 'schema_version');
    end if;

    if v_id is not null and not (v_id = any(v_ids)) then
      v_ids := array_append(v_ids, v_id);
    end if;
  end loop;

  return v_ids;
end;
$$;

-- Starts or replays a scoring run. A credit is reserved by decrementing the
-- visible balance inside this transaction; only completion writes a debit log.
-- Failure and unscorable paths return the reservation without a log entry.
create or replace function public.begin_score_run(
  p_user_id text,
  p_request_key text,
  p_request_fingerprint text,
  p_domain text,
  p_company_name text,
  p_scoring_version text,
  p_profile_hash text,
  p_skip_charge boolean default false,
  p_bind_idempotency boolean default false
)
returns table (
  run_id uuid,
  run_status text,
  stored_result jsonb,
  error_code text,
  cache_hit boolean,
  credits_remaining numeric,
  is_baseline boolean,
  owns_run boolean,
  idempotent_replay boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.score_runs%rowtype;
  v_new public.score_runs%rowtype;
  v_alias public.score_runs%rowtype;
  v_credits numeric;
  v_refund_count integer := 0;
  v_is_baseline boolean;
begin
  if nullif(trim(p_request_key), '') is null
    or nullif(trim(p_request_fingerprint), '') is null
    or nullif(trim(p_domain), '') is null then
    raise exception 'request key, fingerprint, and domain are required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id, 0));

  select u.credits_remaining into v_credits
  from public.users u
  where u.id = p_user_id
  for update;

  if not found then
    return query select null::uuid, 'rejected'::text, null::jsonb,
      'user_not_found'::text, false, null::numeric, null::boolean, false, false;
    return;
  end if;

  -- Recover reservations left behind by terminated serverless invocations.
  with stale_targets as (
    select sr.id, sr.credit_reserved
    from public.score_runs sr
    where sr.user_id = p_user_id
      and sr.status = 'running'
      and sr.started_at < now() - interval '15 minutes'
    for update
  ), stale as (
    update public.score_runs sr
    set
      status = 'failed',
      credit_reserved = false,
      failure_code = 'run_timeout',
      failure_message = 'Scoring run did not reach a terminal state',
      completed_at = now(),
      updated_at = now()
    from stale_targets target
    where sr.id = target.id
    returning target.credit_reserved
  )
  select count(*) filter (where credit_reserved)::integer
  into v_refund_count
  from stale;

  if v_refund_count > 0 then
    update public.users u
    set credits_remaining = u.credits_remaining + v_refund_count
    where u.id = p_user_id
    returning u.credits_remaining into v_credits;
  end if;

  select sr.* into v_existing
  from public.score_runs sr
  where sr.user_id = p_user_id
    and sr.request_key = p_request_key
  limit 1;

  if found then
    if v_existing.request_fingerprint <> p_request_fingerprint then
      return query select v_existing.id, 'rejected'::text, null::jsonb,
        'idempotency_conflict'::text, false, v_credits, v_existing.is_baseline, false,
        p_bind_idempotency;
    else
      return query select v_existing.id, v_existing.status, v_existing.result,
        v_existing.failure_code, (v_existing.status = 'completed'), v_credits,
        v_existing.is_baseline, false, p_bind_idempotency;
    end if;
    return;
  end if;

  -- Redis is an optimization; this database-backed result cache is authoritative.
  select sr.* into v_existing
  from public.score_runs sr
  where sr.user_id = p_user_id
    and sr.canonical_domain = lower(trim(p_domain))
    and sr.profile_hash = p_profile_hash
    and sr.scoring_version = p_scoring_version
    and sr.status = 'completed'
    and sr.cache_expires_at > now()
    and sr.result is not null
  order by sr.completed_at desc
  limit 1;

  if found then
    if p_bind_idempotency then
      -- Bind a new client idempotency key even when the personalized result is
      -- already cached. A later reuse can then replay or reject by fingerprint.
      insert into public.score_runs (
        user_id,
        request_key,
        request_fingerprint,
        canonical_domain,
        company_name,
        scoring_version,
        profile_hash,
        status,
        score_status,
        data_coverage,
        is_baseline,
        automation_eligible,
        source_status,
        evidence_ids,
        score_id,
        result,
        charge_required,
        credit_reserved,
        cache_expires_at,
        completed_at
      ) values (
        p_user_id,
        p_request_key,
        p_request_fingerprint,
        v_existing.canonical_domain,
        p_company_name,
        v_existing.scoring_version,
        v_existing.profile_hash,
        'completed',
        v_existing.score_status,
        v_existing.data_coverage,
        v_existing.is_baseline,
        v_existing.automation_eligible,
        v_existing.source_status,
        v_existing.evidence_ids,
        v_existing.score_id,
        v_existing.result,
        false,
        false,
        v_existing.cache_expires_at,
        now()
      )
      returning * into v_alias;

      return query select v_alias.id, v_alias.status, v_alias.result,
        null::text, true, v_credits, v_alias.is_baseline, false, false;
    else
      return query select v_existing.id, v_existing.status, v_existing.result,
        null::text, true, v_credits, v_existing.is_baseline, false, false;
    end if;
    return;
  end if;

  -- Deduplicate concurrent cache misses for the same personalized score.
  select sr.* into v_existing
  from public.score_runs sr
  where sr.user_id = p_user_id
    and sr.canonical_domain = lower(trim(p_domain))
    and sr.profile_hash = p_profile_hash
    and sr.scoring_version = p_scoring_version
    and sr.status = 'running'
  order by sr.started_at desc
  limit 1;

  if found then
    return query select v_existing.id, v_existing.status, null::jsonb,
      null::text, false, v_credits, v_existing.is_baseline, false, false;
    return;
  end if;

  if not p_skip_charge then
    if v_credits < 1 then
      return query select null::uuid, 'rejected'::text, null::jsonb,
        'insufficient_credits'::text, false, v_credits, null::boolean, false, false;
      return;
    end if;

    update public.users u
    set credits_remaining = u.credits_remaining - 1
    where u.id = p_user_id
      and u.credits_remaining >= 1
    returning u.credits_remaining into v_credits;

    if not found then
      return query select null::uuid, 'rejected'::text, null::jsonb,
        'insufficient_credits'::text, false, v_credits, null::boolean, false, false;
      return;
    end if;
  end if;

  -- The first persisted v2 result is a baseline. This decision is made while
  -- holding the per-user advisory lock so concurrent first scores cannot both
  -- become automation-eligible.
  select not exists (
    select 1
    from public.scores s
    where s.user_id = p_user_id
      and s.domain = lower(trim(p_domain))
      and s.scoring_version = p_scoring_version
      and s.score_status in ('complete', 'partial')
    union all
    select 1
    from public.score_runs prior
    where prior.user_id = p_user_id
      and prior.canonical_domain = lower(trim(p_domain))
      and prior.scoring_version = p_scoring_version
      and prior.status = 'completed'
  ) into v_is_baseline;

  insert into public.score_runs (
    user_id,
    request_key,
    request_fingerprint,
    canonical_domain,
    company_name,
    scoring_version,
    profile_hash,
    is_baseline,
    charge_required,
    credit_reserved
  ) values (
    p_user_id,
    p_request_key,
    p_request_fingerprint,
    lower(trim(p_domain)),
    p_company_name,
    p_scoring_version,
    p_profile_hash,
    v_is_baseline,
    not p_skip_charge,
    not p_skip_charge
  )
  returning * into v_new;

  return query select v_new.id, v_new.status, null::jsonb, null::text,
    false, v_credits, v_new.is_baseline, true, false;
end;
$$;

-- Persists evidence, the user-facing score history row, the replayable result,
-- and the single debit log entry in one transaction.
create or replace function public.complete_score_run(
  p_run_id uuid,
  p_result jsonb,
  p_evidence jsonb default '[]'::jsonb
)
returns table (
  completed_run_id uuid,
  completed_score_id uuid,
  stored_result jsonb,
  charged boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.score_runs%rowtype;
  v_score_id uuid;
  v_evidence_ids uuid[];
  v_stored_result jsonb;
  v_score_status text;
  v_automation_eligible boolean;
  v_was_reserved boolean;
  v_previous_v2_score integer;
  v_previous_v2_band text;
  v_is_baseline boolean;
begin
  select sr.* into v_run
  from public.score_runs sr
  where sr.id = p_run_id;

  if not found then
    raise exception 'score run not found';
  end if;

  -- Serialize completion with run creation and other completions for this user.
  -- This makes the prior-v2 comparison and baseline decision atomic.
  perform pg_advisory_xact_lock(hashtextextended(v_run.user_id, 0));

  select sr.* into v_run
  from public.score_runs sr
  where sr.id = p_run_id
  for update;

  if v_run.status = 'completed' then
    return query select v_run.id, v_run.score_id, v_run.result,
      (v_run.charged_at is not null);
    return;
  end if;

  if v_run.status <> 'running' then
    raise exception 'score run is already %', v_run.status;
  end if;

  if p_result is null or jsonb_typeof(p_result) <> 'object' then
    raise exception 'score result must be a JSON object';
  end if;

  v_score_status := p_result ->> 'score_status';
  if v_score_status not in ('complete', 'partial')
    or p_result ->> 'intent_score' is null
    or p_result ->> 'score_band' not in ('HOT', 'WARM', 'COLD') then
    raise exception 'only complete or partial scored results can be completed';
  end if;

  -- Capture the comparison state before inserting this score. Automation must
  -- compare against the immediately prior persisted result from the same model
  -- version, never a legacy or stale watchlist value.
  select s.score, s.score_band
  into v_previous_v2_score, v_previous_v2_band
  from public.scores s
  where s.user_id = v_run.user_id
    and s.domain = v_run.canonical_domain
    and s.scoring_version = v_run.scoring_version
    and s.score_status in ('complete', 'partial')
  order by s.created_at desc, s.id desc
  limit 1;

  v_is_baseline := v_previous_v2_score is null;
  v_evidence_ids := public.persist_signal_evidence(p_evidence);
  v_automation_eligible := v_score_status = 'complete' and not v_is_baseline;
  v_was_reserved := v_run.credit_reserved;

  insert into public.scores (
    user_id,
    domain,
    company_name,
    score,
    score_band,
    signals,
    ai_summary,
    recommended_action,
    buying_stage,
    urgency,
    key_triggers,
    why_now,
    email_subject,
    talk_track,
    expires_at,
    score_run_id,
    scoring_version,
    profile_hash,
    score_status,
    data_coverage,
    confidence,
    raw_score,
    icp_fit_score,
    contributions,
    source_status,
    is_baseline,
    automation_eligible,
    evidence_ids,
    model_tier,
    model_fallback,
    score_explanation
  ) values (
    v_run.user_id,
    v_run.canonical_domain,
    v_run.company_name,
    (p_result ->> 'intent_score')::integer,
    p_result ->> 'score_band',
    p_result -> 'signals',
    coalesce(p_result ->> 'ai_summary', ''),
    coalesce(p_result ->> 'recommended_action', ''),
    p_result ->> 'buying_stage',
    p_result ->> 'urgency',
    coalesce(p_result -> 'key_triggers', '[]'::jsonb),
    p_result ->> 'why_now',
    p_result ->> 'email_subject',
    p_result ->> 'talk_track',
    coalesce(nullif(p_result ->> 'score_decay_date', '')::timestamptz, now() + interval '30 days'),
    v_run.id,
    v_run.scoring_version,
    v_run.profile_hash,
    v_score_status,
    nullif(p_result ->> 'data_coverage', '')::numeric,
    nullif(p_result ->> 'confidence', '')::numeric,
    nullif(p_result ->> 'raw_score', '')::integer,
    nullif(p_result ->> 'icp_fit_score', '')::integer,
    coalesce(p_result -> 'contributions', '[]'::jsonb),
    coalesce(p_result -> 'source_status', '{}'::jsonb),
    v_is_baseline,
    v_automation_eligible,
    v_evidence_ids,
    p_result ->> 'model_tier',
    coalesce((p_result ->> 'model_fallback')::boolean, false),
    p_result ->> 'score_explanation'
  )
  returning id into v_score_id;

  v_stored_result := p_result || jsonb_build_object(
    'score_id', v_score_id,
    'score_run_id', v_run.id,
    'scoring_version', v_run.scoring_version,
    'profile_hash', v_run.profile_hash,
    'is_baseline', v_is_baseline,
    'automation_eligible', v_automation_eligible,
    'previous_v2_score', v_previous_v2_score,
    'previous_v2_band', v_previous_v2_band,
    'cached', false,
    'charged', v_was_reserved
  );

  if v_was_reserved then
    insert into public.credits_log (user_id, amount, type, reason, score_run_id)
    values (v_run.user_id, 1, 'debit', 'API score request', v_run.id)
    on conflict do nothing;
  end if;

  update public.score_runs sr
  set
    status = 'completed',
    score_status = v_score_status,
    data_coverage = nullif(p_result ->> 'data_coverage', '')::numeric,
    is_baseline = v_is_baseline,
    automation_eligible = v_automation_eligible,
    source_status = coalesce(p_result -> 'source_status', '{}'::jsonb),
    evidence_ids = v_evidence_ids,
    score_id = v_score_id,
    result = v_stored_result,
    credit_reserved = false,
    charged_at = case when v_was_reserved then now() else null end,
    cache_expires_at = now() + interval '6 hours',
    completed_at = now(),
    updated_at = now()
  where sr.id = v_run.id;

  return query select v_run.id, v_score_id, v_stored_result, v_was_reserved;
end;
$$;

-- Terminates a run and refunds an outstanding reservation exactly once.
-- Unscorable runs may still persist reusable source evidence, but never insert
-- a row into scores and therefore never appear in user score history.
create or replace function public.fail_score_run(
  p_run_id uuid,
  p_error_code text,
  p_error_message text default null,
  p_unscorable boolean default false,
  p_result jsonb default null,
  p_evidence jsonb default '[]'::jsonb
)
returns table (
  failed_run_id uuid,
  run_status text,
  refunded boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.score_runs%rowtype;
  v_refunded boolean := false;
  v_evidence_ids uuid[] := '{}'::uuid[];
  v_status text;
begin
  select sr.* into v_run
  from public.score_runs sr
  where sr.id = p_run_id;

  if not found then
    raise exception 'score run not found';
  end if;

  -- Match begin/complete/reaper lock ordering before a refund touches the user
  -- balance. This avoids a row-lock inversion between score_runs and users.
  perform pg_advisory_xact_lock(hashtextextended(v_run.user_id, 0));

  select sr.* into v_run
  from public.score_runs sr
  where sr.id = p_run_id
  for update;

  if not found then
    raise exception 'score run not found';
  end if;

  if v_run.status = 'completed' then
    return query select v_run.id, v_run.status, false;
    return;
  end if;

  v_evidence_ids := public.persist_signal_evidence(p_evidence);

  if v_run.status in ('failed', 'unscorable') then
    return query select v_run.id, v_run.status, false;
    return;
  end if;

  if v_run.credit_reserved then
    update public.users u
    set credits_remaining = u.credits_remaining + 1
    where u.id = v_run.user_id;
    v_refunded := true;
  end if;

  v_status := case when p_unscorable then 'unscorable' else 'failed' end;

  update public.score_runs sr
  set
    status = v_status,
    score_status = case when p_unscorable then 'unscorable' else null end,
    data_coverage = nullif(p_result ->> 'data_coverage', '')::numeric,
    automation_eligible = false,
    source_status = coalesce(p_result -> 'source_status', '{}'::jsonb),
    evidence_ids = v_evidence_ids,
    result = p_result,
    credit_reserved = false,
    failure_code = p_error_code,
    failure_message = left(p_error_message, 1000),
    completed_at = now(),
    updated_at = now()
  where sr.id = v_run.id;

  return query select v_run.id, v_status, v_refunded;
end;
$$;

-- Reap abandoned serverless invocations without waiting for the affected user
-- to start another score. Each user's runs and credit refund are handled under
-- the same advisory lock used by begin/complete, and the running-status update
-- makes repeated or concurrent calls idempotent.
create or replace function public.reap_stale_score_runs(
  p_user_batch_size integer default 100
)
returns table (
  users_reaped integer,
  runs_reaped integer,
  credits_refunded integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate record;
  v_runs integer;
  v_refunds integer;
begin
  if p_user_batch_size < 1 or p_user_batch_size > 1000 then
    raise exception 'user batch size must be between 1 and 1000';
  end if;

  users_reaped := 0;
  runs_reaped := 0;
  credits_refunded := 0;

  for v_candidate in
    select sr.user_id, min(sr.started_at) as oldest_started_at
    from public.score_runs sr
    where sr.status = 'running'
      and sr.started_at < now() - interval '15 minutes'
    group by sr.user_id
    order by min(sr.started_at), sr.user_id
    limit p_user_batch_size
  loop
    -- Do not block score creation/completion. A locked user remains eligible for
    -- the next reaper invocation or begin_score_run's inline recovery path.
    if not pg_try_advisory_xact_lock(hashtextextended(v_candidate.user_id, 0)) then
      continue;
    end if;

    with stale_targets as (
      select sr.id, sr.credit_reserved
      from public.score_runs sr
      where sr.user_id = v_candidate.user_id
        and sr.status = 'running'
        and sr.started_at < now() - interval '15 minutes'
      for update
    ), stale as (
      update public.score_runs sr
      set
        status = 'failed',
        credit_reserved = false,
        failure_code = 'run_timeout',
        failure_message = 'Scoring run did not reach a terminal state',
        completed_at = now(),
        updated_at = now()
      from stale_targets target
      where sr.id = target.id
      returning target.credit_reserved
    )
    select
      count(*)::integer,
      count(*) filter (where credit_reserved)::integer
    into v_runs, v_refunds
    from stale;

    if v_runs = 0 then
      continue;
    end if;

    if v_refunds > 0 then
      update public.users u
      set credits_remaining = u.credits_remaining + v_refunds
      where u.id = v_candidate.user_id;

      if not found then
        raise exception 'score-run user % was not found', v_candidate.user_id;
      end if;
    end if;

    users_reaped := users_reaped + 1;
    runs_reaped := runs_reaped + v_runs;
    credits_refunded := credits_refunded + v_refunds;
  end loop;

  return next;
end;
$$;

revoke all on function public.persist_signal_evidence(jsonb) from public;
revoke all on function public.begin_score_run(text, text, text, text, text, text, text, boolean, boolean) from public;
revoke all on function public.complete_score_run(uuid, jsonb, jsonb) from public;
revoke all on function public.fail_score_run(uuid, text, text, boolean, jsonb, jsonb) from public;
revoke all on function public.reap_stale_score_runs(integer) from public;
revoke all on function public.persist_signal_evidence(jsonb) from anon, authenticated;
revoke all on function public.begin_score_run(text, text, text, text, text, text, text, boolean, boolean) from anon, authenticated;
revoke all on function public.complete_score_run(uuid, jsonb, jsonb) from anon, authenticated;
revoke all on function public.fail_score_run(uuid, text, text, boolean, jsonb, jsonb) from anon, authenticated;
revoke all on function public.reap_stale_score_runs(integer) from anon;
revoke all on function public.reap_stale_score_runs(integer) from authenticated;

grant execute on function public.persist_signal_evidence(jsonb) to service_role;
grant execute on function public.begin_score_run(text, text, text, text, text, text, text, boolean, boolean) to service_role;
grant execute on function public.complete_score_run(uuid, jsonb, jsonb) to service_role;
grant execute on function public.fail_score_run(uuid, text, text, boolean, jsonb, jsonb) to service_role;
grant execute on function public.reap_stale_score_runs(integer) to service_role;

-- Supabase Cron is optional. When pg_cron has been enabled before this
-- migration, install/update the named five-minute recovery job. Otherwise the
-- service-role RPC remains available to an external scheduler.
do $scoring_v2_cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
    and to_regnamespace('cron') is not null then
    perform cron.schedule(
      'scoring-v2-stale-run-reaper',
      '*/5 * * * *',
      'select * from public.reap_stale_score_runs(100)'
    );
  else
    raise notice 'pg_cron is not enabled; schedule public.reap_stale_score_runs with a service-role scheduler';
  end if;
end
$scoring_v2_cron$;

comment on table public.signal_evidence is
  'Workspace-neutral signal observations. Background workers upsert by canonical domain, type, source, and schema version.';
comment on table public.score_runs is
  'Transactional scoring attempts, idempotent results, terminal failures, and credit reservation state.';
