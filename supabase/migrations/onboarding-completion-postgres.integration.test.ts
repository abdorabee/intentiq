import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const enabled = process.env.ONBOARDING_DB_TESTS === "true";
const databaseUrl = process.env.ONBOARDING_TEST_DATABASE_URL?.trim();

if (enabled && !databaseUrl) {
  throw new Error("ONBOARDING_TEST_DATABASE_URL is required when ONBOARDING_DB_TESTS=true");
}

const migrationSql = readFileSync(
  new URL("./20260823181538_onboarding_completion_version.sql", import.meta.url),
  "utf8",
);

const suite = enabled ? describe.sequential : describe.skip;

suite("onboarding completion Postgres migration", () => {
  let pool: Pool;

  beforeAll(async () => {
    const parsed = new URL(databaseUrl!);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    if (!/(test|testing|ci|tmp|ephemeral)/i.test(databaseName)) {
      throw new Error(`Refusing to reset non-test database '${databaseName}'`);
    }
    if (process.env.ONBOARDING_TEST_ALLOW_RESET !== databaseName) {
      throw new Error(`Set ONBOARDING_TEST_ALLOW_RESET=${databaseName} to confirm reset`);
    }

    pool = new Pool({ connectionString: databaseUrl, max: 2 });
    await pool.query("drop schema if exists public cascade; create schema public");
    await pool.query(`
      create table public.users (
        id text primary key,
        onboarding_completed boolean not null default false,
        onboarding_completed_at timestamptz,
        created_at timestamptz not null default now()
      );
      create table public.user_preferences (
        user_id text primary key,
        onboarding_step integer not null default 0,
        onboarding_draft jsonb not null default '{}'::jsonb,
        onboarding_version integer not null default 0,
        updated_at timestamptz not null default now()
      );
      insert into public.users (id, onboarding_completed, created_at)
      values
        ('completed', true, '2026-08-01T00:00:00Z'),
        ('incomplete', false, '2026-08-02T00:00:00Z');
    `);
    await pool.query(`
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
      end $$;
    `);
    await pool.query(migrationSql);
  }, 30_000);

  afterAll(async () => {
    if (!pool) return;
    await pool.query("drop schema if exists public cascade; create schema public");
    await pool.end();
  });

  it("backfills only completed users with authoritative timestamp and version", async () => {
    const result = await pool.query(`
      select id, onboarding_completed, onboarding_completed_at, onboarding_completed_version
      from public.users order by id
    `);

    expect(result.rows).toEqual([
      {
        id: "completed",
        onboarding_completed: true,
        onboarding_completed_at: new Date("2026-08-01T00:00:00.000Z"),
        onboarding_completed_version: 1,
      },
      {
        id: "incomplete",
        onboarding_completed: false,
        onboarding_completed_at: null,
        onboarding_completed_version: 0,
      },
    ]);
  });

  it("rejects negative completion versions", async () => {
    await expect(
      pool.query("update public.users set onboarding_completed_version = -1 where id = 'incomplete'"),
    ).rejects.toThrow();
  });

  it("rejects inconsistent completion tuples", async () => {
    await expect(pool.query(`
      update public.users
      set onboarding_completed_at = now()
      where id = 'incomplete'
    `)).rejects.toThrow();
    await expect(pool.query(`
      update public.users
      set onboarding_completed = true, onboarding_completed_at = null, onboarding_completed_version = 1
      where id = 'incomplete'
    `)).rejects.toThrow();
    await expect(pool.query(`
      update public.users
      set onboarding_completed = true, onboarding_completed_at = now(), onboarding_completed_version = 0
      where id = 'incomplete'
    `)).rejects.toThrow();
  });

  it("keeps the newer durable progress when requests arrive out of order", async () => {
    const newer = await pool.query(
      "select * from public.save_onboarding_progress($1, $2, $3, $4, $5)",
      ["revision_owner", 2, { product_category: "Newer" }, 1, 2],
    );
    const stale = await pool.query(
      "select * from public.save_onboarding_progress($1, $2, $3, $4, $5)",
      ["revision_owner", 1, { product_category: "Older" }, 1, 1],
    );
    const stored = await pool.query(`
      select onboarding_step, onboarding_draft, onboarding_revision
      from public.user_preferences
      where user_id = 'revision_owner'
    `);

    expect(newer.rowCount).toBe(1);
    expect(stale.rowCount).toBe(0);
    expect(stored.rows).toEqual([{
      onboarding_step: 2,
      onboarding_draft: { product_category: "Newer" },
      onboarding_revision: "2",
    }]);
  });
});
