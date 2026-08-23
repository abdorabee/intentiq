import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const enabled = process.env.PREFERENCES_DB_TESTS === "true";
const databaseUrl = process.env.PREFERENCES_TEST_DATABASE_URL?.trim();

if (enabled && !databaseUrl) {
  throw new Error("PREFERENCES_TEST_DATABASE_URL is required when PREFERENCES_DB_TESTS=true");
}

const migrationSql = readFileSync(
  new URL("./20260823155702_user_preferences.sql", import.meta.url),
  "utf8",
);

const fixtureSql = `
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

create table public.users (
  id text primary key,
  onboarding_completed boolean not null default false
);
`;

const suite = enabled ? describe.sequential : describe.skip;

suite("user preferences Postgres migration", () => {
  let pool: Pool;

  beforeAll(async () => {
    const parsed = new URL(databaseUrl!);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const resetConfirmation = process.env.PREFERENCES_TEST_ALLOW_RESET;

    if (!/(test|testing|ci|tmp|ephemeral)/i.test(databaseName)) {
      throw new Error(`Refusing to reset non-test database '${databaseName}'`);
    }
    if (resetConfirmation !== databaseName) {
      throw new Error(`Set PREFERENCES_TEST_ALLOW_RESET=${databaseName} to confirm reset`);
    }

    pool = new Pool({ connectionString: databaseUrl, max: 4 });
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
    await pool.query("truncate public.users cascade");
  });

  it("applies defaults, bounds, one-to-one ownership, cascade, and timestamp behavior", async () => {
    await pool.query("insert into public.users (id) values ('user_test')");
    await pool.query(`
      insert into public.user_preferences (user_id, updated_at)
      values ('user_test', '2020-01-01T00:00:00Z')
    `);

    const defaults = await pool.query(`
      select theme, sidebar_collapsed, analytics_enabled, onboarding_version,
        onboarding_step, onboarding_draft, tour_version, tour_status, tour_step,
        tour_updated_at
      from public.user_preferences where user_id = 'user_test'
    `);
    expect(defaults.rows[0]).toMatchObject({
      theme: "system",
      sidebar_collapsed: false,
      analytics_enabled: true,
      onboarding_version: 0,
      onboarding_step: 0,
      onboarding_draft: {},
      tour_version: 0,
      tour_status: "not_started",
      tour_step: 0,
      tour_updated_at: null,
    });

    await expect(pool.query(`
      insert into public.user_preferences (user_id) values ('user_test')
    `)).rejects.toThrow();
    await expect(pool.query(`
      update public.user_preferences set theme = 'midnight' where user_id = 'user_test'
    `)).rejects.toThrow();
    await expect(pool.query(`
      update public.user_preferences set onboarding_draft = '[]'::jsonb where user_id = 'user_test'
    `)).rejects.toThrow();

    await pool.query(`
      update public.user_preferences set theme = 'light' where user_id = 'user_test'
    `);
    const timestamp = await pool.query(`
      select updated_at > '2020-01-01T00:00:00Z'::timestamptz as advanced
      from public.user_preferences where user_id = 'user_test'
    `);
    expect(timestamp.rows[0].advanced).toBe(true);

    await pool.query("delete from public.users where id = 'user_test'");
    const remaining = await pool.query("select count(*)::integer as count from public.user_preferences");
    expect(remaining.rows[0].count).toBe(0);
  });

  it("retains the onboarding boolean and adds its nullable completion timestamp", async () => {
    const columns = await pool.query(`
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name in ('onboarding_completed', 'onboarding_completed_at')
      order by column_name
    `);

    expect(columns.rows).toEqual([
      { column_name: "onboarding_completed", data_type: "boolean", is_nullable: "NO" },
      { column_name: "onboarding_completed_at", data_type: "timestamp with time zone", is_nullable: "YES" },
    ]);
  });

  it("exposes only the required operations to service_role and none to browser roles", async () => {
    const privileges = await pool.query(`
      select
        has_table_privilege('service_role', 'public.user_preferences', 'select') as service_select,
        has_table_privilege('service_role', 'public.user_preferences', 'insert') as service_insert,
        has_table_privilege('service_role', 'public.user_preferences', 'update') as service_update,
        has_table_privilege('service_role', 'public.user_preferences', 'delete') as service_delete,
        has_table_privilege('anon', 'public.user_preferences', 'select') as anon_select,
        has_table_privilege('authenticated', 'public.user_preferences', 'select') as authenticated_select
    `);

    expect(privileges.rows[0]).toEqual({
      service_select: true,
      service_insert: true,
      service_update: true,
      service_delete: false,
      anon_select: false,
      authenticated_select: false,
    });
  });
});
