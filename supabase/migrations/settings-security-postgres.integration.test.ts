import { readFileSync } from "node:fs";

import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const enabled = process.env.SETTINGS_SECURITY_DB_TESTS === "true";
const databaseUrl = process.env.SETTINGS_SECURITY_TEST_DATABASE_URL;
const migrationSql = readFileSync(
  new URL("./20260823170104_settings_security_contract.sql", import.meta.url),
  "utf8",
);

const fixtureSql = `
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
create table public.users (
  id text primary key,
  email text not null,
  plan text not null default 'free'
);
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  key_hash text not null unique,
  label text not null,
  last_used timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.user_preferences (
  user_id text primary key references public.users(id) on delete cascade
);
grant select, update, delete on public.users to service_role;
grant select, insert, update on public.api_keys to service_role;
`;

const suite = enabled ? describe.sequential : describe.skip;

suite("settings security Postgres contract", () => {
  let pool: Pool;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error("SETTINGS_SECURITY_TEST_DATABASE_URL is required");
    const parsed = new URL(databaseUrl);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    if (!/(test|testing|ci|tmp|ephemeral)/i.test(databaseName)) throw new Error(`Refusing to reset non-test database '${databaseName}'`);
    if (process.env.SETTINGS_SECURITY_TEST_ALLOW_RESET !== databaseName) throw new Error(`Set SETTINGS_SECURITY_TEST_ALLOW_RESET=${databaseName} to confirm reset`);
    pool = new Pool({ connectionString: databaseUrl, max: 6 });
    await pool.query("drop schema if exists public cascade; create schema public");
    await pool.query(fixtureSql);
    await pool.query(migrationSql);
  }, 30_000);

  afterAll(async () => {
    if (!pool) return;
    await pool.query("drop schema if exists public cascade; create schema public");
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query("truncate public.clerk_webhook_events, public.users cascade");
  });

  it("serializes concurrent active-key creation and stores only SHA-256 hashes", async () => {
    await pool.query("insert into public.users (id, email, plan) values ('user_free', 'free@example.com', 'free')");
    const attempts = await Promise.allSettled([
      pool.query("select * from public.create_api_key_atomic($1, $2, $3)", ["user_free", "a".repeat(64), "First"]),
      pool.query("select * from public.create_api_key_atomic($1, $2, $3)", ["user_free", "b".repeat(64), "Second"]),
    ]);
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
    const stored = await pool.query("select user_id, key_hash, label, is_active from public.api_keys");
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0].user_id).toBe("user_free");
    expect(stored.rows[0].key_hash).toMatch(/^[ab]{64}$/);
    expect(JSON.stringify(stored.rows)).not.toContain("vesperwise_");
  });

  it("counts active keys only", async () => {
    await pool.query("insert into public.users (id, email, plan) values ('user_free', 'free@example.com', 'free')");
    await pool.query("insert into public.api_keys (user_id, key_hash, label, is_active) values ('user_free', $1, 'Old', false)", ["c".repeat(64)]);
    const created = await pool.query("select * from public.create_api_key_atomic($1, $2, $3)", ["user_free", "d".repeat(64), "New"]);
    expect(created.rows[0]).toMatchObject({ user_id: "user_free", label: "New", plan_limit: 1 });
  });

  it("updates and deletes only the signed event user, idempotently, with cascade", async () => {
    await pool.query("insert into public.users (id, email) values ('user_owner', 'old@example.com'), ('user_other', 'other@example.com')");
    await pool.query("insert into public.api_keys (user_id, key_hash, label) values ('user_owner', $1, 'Owner')", ["e".repeat(64)]);
    await pool.query("insert into public.user_preferences (user_id) values ('user_owner')");
    expect((await pool.query("select public.process_clerk_user_lifecycle_event('evt_update', 'user.updated', 'user_owner', 'new@example.com') as result")).rows[0].result).toBe("processed");
    expect((await pool.query("select public.process_clerk_user_lifecycle_event('evt_update', 'user.updated', 'user_other', 'attacker@example.com') as result")).rows[0].result).toBe("duplicate");
    expect((await pool.query("select id, email from public.users order by id")).rows).toEqual([
      { id: "user_other", email: "other@example.com" },
      { id: "user_owner", email: "new@example.com" },
    ]);
    await pool.query("select public.process_clerk_user_lifecycle_event('evt_delete', 'user.deleted', 'user_owner', null)");
    expect((await pool.query("select count(*)::integer as count from public.api_keys where user_id = 'user_owner'")).rows[0].count).toBe(0);
    expect((await pool.query("select count(*)::integer as count from public.user_preferences where user_id = 'user_owner'")).rows[0].count).toBe(0);
    expect((await pool.query("select email from public.users where id = 'user_other'")).rows[0].email).toBe("other@example.com");
  });

  it("rolls back event idempotency state on an update error so delivery can retry", async () => {
    await expect(pool.query("select public.process_clerk_user_lifecycle_event('evt_retry', 'user.updated', 'user_late', 'late@example.com')")).rejects.toThrow(/CLERK_USER_NOT_FOUND/);
    expect((await pool.query("select count(*)::integer as count from public.clerk_webhook_events where event_id = 'evt_retry'")).rows[0].count).toBe(0);
    await pool.query("insert into public.users (id, email) values ('user_late', 'old@example.com')");
    expect((await pool.query("select public.process_clerk_user_lifecycle_event('evt_retry', 'user.updated', 'user_late', 'late@example.com') as result")).rows[0].result).toBe("processed");
  });

  it("fails closed when a user-owned table is added without a cascade dependency", async () => {
    await pool.query("insert into public.users (id, email) values ('user_guarded', 'guarded@example.com')");
    await pool.query("create table public.unsafe_notes (id integer primary key, user_id text not null)");
    await expect(pool.query("select public.process_clerk_user_lifecycle_event('evt_guarded', 'user.deleted', 'user_guarded', null)")).rejects.toThrow(/CLERK_USER_CASCADE_CONTRACT_UNVERIFIED/);
    expect((await pool.query("select count(*)::integer as count from public.users where id = 'user_guarded'")).rows[0].count).toBe(1);
    await pool.query("drop table public.unsafe_notes");
  });

  it("denies browser roles and grants only service-role execution", async () => {
    const result = await pool.query(`select
      has_function_privilege('anon', 'public.create_api_key_atomic(text,text,text)', 'execute') as anon_create,
      has_function_privilege('authenticated', 'public.process_clerk_user_lifecycle_event(text,text,text,text)', 'execute') as auth_lifecycle,
      has_function_privilege('service_role', 'public.create_api_key_atomic(text,text,text)', 'execute') as service_create,
      has_function_privilege('service_role', 'public.process_clerk_user_lifecycle_event(text,text,text,text)', 'execute') as service_lifecycle`);
    expect(result.rows[0]).toEqual({ anon_create: false, auth_lifecycle: false, service_create: true, service_lifecycle: true });
  });
});
