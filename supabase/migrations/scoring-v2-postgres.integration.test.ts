import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const enabled = process.env.SCORING_V2_DB_TESTS === "true";
const databaseUrl = process.env.SCORING_V2_TEST_DATABASE_URL?.trim();

if (enabled && !databaseUrl) {
  throw new Error(
    "SCORING_V2_TEST_DATABASE_URL is required when SCORING_V2_DB_TESTS=true"
  );
}

const migrationSql = readFileSync(
  new URL("./20260715000000_scoring_v2_pipeline.sql", import.meta.url),
  "utf8"
);
const migrationV3Sql = readFileSync(
  new URL("./20260727000000_scoring_v3.sql", import.meta.url),
  "utf8"
);

const fixtureSql = `
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

create schema if not exists auth;
create or replace function auth.uid()
returns uuid language sql stable as $$ select null::uuid $$;

create table public.users (
  id text primary key,
  credits_remaining numeric(10,2) not null default 20
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  domain text not null,
  company_name text not null,
  score integer not null,
  score_band text not null,
  signals jsonb not null,
  ai_summary text not null,
  recommended_action text not null,
  buying_stage text,
  urgency text,
  key_triggers jsonb,
  why_now text,
  email_subject text,
  talk_track text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.credits_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  amount numeric(10,2) not null,
  type text not null,
  reason text not null,
  created_at timestamptz not null default now()
);
`;

interface BeginRunRow {
  run_id: string | null;
  run_status: string;
  stored_result: Record<string, unknown> | null;
  error_code: string | null;
  cache_hit: boolean;
  credits_remaining: string | null;
  is_baseline: boolean | null;
  owns_run: boolean;
  idempotent_replay: boolean;
}

function scoredResult(score = 75) {
  return {
    company: "Acme",
    domain: "acme.test",
    intent_score: score,
    score_band: score >= 75 ? "HOT" : score >= 50 ? "WARM" : "COLD",
    score_status: "complete",
    data_coverage: 1,
    confidence: 1,
    raw_score: score,
    signals: {},
    contributions: [],
    source_status: {},
    ai_summary: "Validated test result",
    recommended_action: "Follow up",
    score_decay_date: "2026-08-14T12:00:00.000Z",
    icp_fit_score: null,
    model_tier: "free",
    model_fallback: true,
  };
}

const suite = enabled ? describe.sequential : describe.skip;

suite("scoring v2 Postgres RPC integration", () => {
  let pool: Pool;

  beforeAll(async () => {
    const parsed = new URL(databaseUrl!);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const resetConfirmation = process.env.SCORING_V2_TEST_ALLOW_RESET;

    if (!/(test|testing|ci|tmp|ephemeral)/i.test(databaseName)) {
      throw new Error(
        `Refusing to reset database '${databaseName}'; use a disposable database whose name contains test, ci, tmp, or ephemeral`
      );
    }
    if (resetConfirmation !== databaseName) {
      throw new Error(
        `Set SCORING_V2_TEST_ALLOW_RESET=${databaseName} to confirm the disposable database reset`
      );
    }

    pool = new Pool({ connectionString: databaseUrl, max: 10 });
    await pool.query("drop schema if exists public cascade; create schema public");
    await pool.query(fixtureSql);
    await pool.query(migrationSql);
    await pool.query(migrationV3Sql);
  }, 30_000);

  afterAll(async () => {
    if (!pool) return;
    await pool.query("drop schema if exists public cascade; create schema public");
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(
      "truncate public.signal_evidence, public.credits_log, public.scores, public.score_runs, public.users cascade"
    );
  });

  async function createUser(userId: string, credits: number) {
    await pool.query(
      "insert into public.users (id, credits_remaining) values ($1, $2)",
      [userId, credits]
    );
  }

  async function beginRun({
    userId,
    requestKey,
    fingerprint = requestKey,
    domain = "acme.test",
    profileHash = "profile-a",
    bindIdempotency = false,
    scoringVersion = "v2-linear-2026-07",
  }: {
    userId: string;
    requestKey: string;
    fingerprint?: string;
    domain?: string;
    profileHash?: string;
    bindIdempotency?: boolean;
    scoringVersion?: string;
  }): Promise<BeginRunRow> {
    const { rows } = await pool.query<BeginRunRow>(
      `select * from public.begin_score_run(
        $1, $2, $3, $4, $5, $6, $7, false, $8
      )`,
      [
        userId,
        requestKey,
        fingerprint,
        domain,
        "Acme",
        scoringVersion,
        profileHash,
        bindIdempotency,
      ]
    );
    return rows[0];
  }

  async function completeRun(runId: string, score = 75) {
    return pool.query(
      "select * from public.complete_score_run($1::uuid, $2::jsonb, '[]'::jsonb)",
      [runId, JSON.stringify(scoredResult(score))]
    );
  }

  async function failRun(runId: string) {
    return pool.query(
      "select * from public.fail_score_run($1::uuid, 'test_failure', 'integration test', false, null, '[]'::jsonb)",
      [runId]
    );
  }

  it("charges exactly one of two concurrent final-credit requests", async () => {
    await createUser("user-final-credit", 1);

    const attempts = await Promise.all([
      beginRun({
        userId: "user-final-credit",
        requestKey: "request-a",
        domain: "a.test",
      }),
      beginRun({
        userId: "user-final-credit",
        requestKey: "request-b",
        domain: "b.test",
      }),
    ]);

    const owner = attempts.find((attempt) => attempt.owns_run);
    const rejected = attempts.find((attempt) => !attempt.owns_run);
    expect(owner?.run_id).toBeTruthy();
    expect(rejected?.error_code).toBe("insufficient_credits");

    await completeRun(owner!.run_id!);
    const state = await pool.query(
      `select
        (select credits_remaining from public.users where id = 'user-final-credit') as credits,
        (select count(*)::integer from public.credits_log where user_id = 'user-final-credit') as debits`
    );
    expect(Number(state.rows[0].credits)).toBe(0);
    expect(state.rows[0].debits).toBe(1);
  });

  it("isolates cached results by user and invalidates them by profile fingerprint", async () => {
    await createUser("user-a", 3);
    await createUser("user-b", 3);

    const first = await beginRun({ userId: "user-a", requestKey: "a-first" });
    await completeRun(first.run_id!);

    const sameUserHit = await beginRun({ userId: "user-a", requestKey: "a-hit" });
    expect(sameUserHit.cache_hit).toBe(true);
    expect(sameUserHit.owns_run).toBe(false);
    expect(Number(sameUserHit.credits_remaining)).toBe(2);

    const otherUser = await beginRun({ userId: "user-b", requestKey: "b-miss" });
    expect(otherUser.cache_hit).toBe(false);
    expect(otherUser.owns_run).toBe(true);
    await failRun(otherUser.run_id!);

    const changedProfile = await beginRun({
      userId: "user-a",
      requestKey: "a-profile-change",
      profileHash: "profile-b",
    });
    expect(changedProfile.cache_hit).toBe(false);
    expect(changedProfile.owns_run).toBe(true);
    await failRun(changedProfile.run_id!);

    const balances = await pool.query(
      "select id, credits_remaining from public.users order by id"
    );
    expect(balances.rows.map((row) => [row.id, Number(row.credits_remaining)])).toEqual([
      ["user-a", 2],
      ["user-b", 3],
    ]);
  });

  it("replays idempotently and refunds after a persistence failure", async () => {
    await createUser("user-replay", 2);

    const first = await beginRun({
      userId: "user-replay",
      requestKey: "stable-key",
      fingerprint: "stable-fingerprint",
      bindIdempotency: true,
    });
    await completeRun(first.run_id!);

    const replay = await beginRun({
      userId: "user-replay",
      requestKey: "stable-key",
      fingerprint: "stable-fingerprint",
      bindIdempotency: true,
    });
    expect(replay.run_status).toBe("completed");
    expect(replay.idempotent_replay).toBe(true);
    expect(replay.stored_result?.intent_score).toBe(75);

    const conflict = await beginRun({
      userId: "user-replay",
      requestKey: "stable-key",
      fingerprint: "different-fingerprint",
      bindIdempotency: true,
    });
    expect(conflict.run_status).toBe("rejected");
    expect(conflict.error_code).toBe("idempotency_conflict");

    const failing = await beginRun({
      userId: "user-replay",
      requestKey: "persistence-failure",
      profileHash: "profile-b",
    });
    await expect(
      pool.query(
        "select * from public.complete_score_run($1::uuid, '{}'::jsonb, '[]'::jsonb)",
        [failing.run_id]
      )
    ).rejects.toThrow();

    await failRun(failing.run_id!);
    const duplicateFailure = await failRun(failing.run_id!);
    expect(duplicateFailure.rows[0].refunded).toBe(false);

    const state = await pool.query(
      `select
        (select credits_remaining from public.users where id = 'user-replay') as credits,
        (select count(*)::integer from public.credits_log where user_id = 'user-replay') as debits`
    );
    expect(Number(state.rows[0].credits)).toBe(1);
    expect(state.rows[0].debits).toBe(1);
  });

  it("reaps abandoned reservations once without requiring another user request", async () => {
    await createUser("user-abandoned", 1);
    const abandoned = await beginRun({
      userId: "user-abandoned",
      requestKey: "abandoned-run",
    });
    await pool.query(
      "update public.score_runs set started_at = now() - interval '16 minutes' where id = $1",
      [abandoned.run_id]
    );

    const firstReap = await pool.query(
      "select * from public.reap_stale_score_runs(100)"
    );
    expect(firstReap.rows[0]).toMatchObject({
      users_reaped: 1,
      runs_reaped: 1,
      credits_refunded: 1,
    });

    const secondReap = await pool.query(
      "select * from public.reap_stale_score_runs(100)"
    );
    expect(secondReap.rows[0]).toMatchObject({
      users_reaped: 0,
      runs_reaped: 0,
      credits_refunded: 0,
    });

    const state = await pool.query(
      `select u.credits_remaining, sr.status, sr.credit_reserved
       from public.users u
       join public.score_runs sr on sr.user_id = u.id
       where u.id = 'user-abandoned'`
    );
    expect(Number(state.rows[0].credits_remaining)).toBe(1);
    expect(state.rows[0]).toMatchObject({ status: "failed", credit_reserved: false });
  });

  it("persists v3 policy metadata in shadow-safe scores and binds one outcome to the exact score", async () => {
    await createUser("user-v3", 2);
    const run = await beginRun({
      userId: "user-v3",
      requestKey: "v3-run",
      scoringVersion: "v3-five-signal-2026-07",
    });
    const result = {
      ...scoredResult(82),
      scoring_version: "v3-five-signal-2026-07",
      scoring_policy_id: "default-v3",
      scoring_policy: {
        id: "default-v3",
        version: "v3-five-signal-2026-07",
        weights: {
          funding: 25,
          hiring: 25,
          news: 20,
          technology: 20,
          web_activity: 10,
        },
      },
      signal_coverage: 5,
      automation_eligible: false,
    };
    const completion = await pool.query(
      "select * from public.complete_score_run($1::uuid, $2::jsonb, '[]'::jsonb)",
      [run.run_id, JSON.stringify(result)]
    );
    const scoreId = completion.rows[0].completed_score_id;
    const stored = await pool.query(
      "select scoring_policy_id, signal_coverage, automation_eligible from public.scores where id = $1",
      [scoreId]
    );
    expect(stored.rows[0]).toMatchObject({
      scoring_policy_id: "default-v3",
      automation_eligible: false,
    });
    expect(Number(stored.rows[0].signal_coverage)).toBe(5);

    await pool.query(
      `insert into public.score_outcomes
        (score_id, user_id, domain, outcome, source, actor_id)
       values ($1, 'user-v3', 'acme.test', 'closed_won', 'manual', 'user-v3')`,
      [scoreId]
    );
    await expect(pool.query(
      `insert into public.score_outcomes
        (score_id, user_id, domain, outcome, source, actor_id)
       values ($1, 'user-v3', 'acme.test', 'closed_lost', 'manual', 'user-v3')`,
      [scoreId]
    )).rejects.toThrow();
  });
});
