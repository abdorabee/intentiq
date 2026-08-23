import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDirectory = join(process.cwd(), "supabase/migrations");
const migrationName = readdirSync(migrationsDirectory).find((name) =>
  name.endsWith("_onboarding_completion_version.sql")
);

describe("onboarding completion migration", () => {
  it("records a nonnegative completion version on the authoritative user row", () => {
    expect(migrationName).toBeTruthy();
    const sql = readFileSync(join(migrationsDirectory, migrationName!), "utf8").toLowerCase();

    expect(sql).toContain("add column if not exists onboarding_completed_version integer");
    expect(sql).toContain("check (onboarding_completed_version >= 0)");
    expect(sql).toContain("users_onboarding_completion_tuple_check");
    expect(sql).toContain("onboarding_completed = false");
    expect(sql).toContain("onboarding_completed_at is null");
  });

  it("backfills legacy completed users without changing incomplete users", () => {
    expect(migrationName).toBeTruthy();
    const sql = readFileSync(join(migrationsDirectory, migrationName!), "utf8").toLowerCase();

    expect(sql).toContain("where onboarding_completed = true");
    expect(sql).toContain("onboarding_completed_at = coalesce(onboarding_completed_at, created_at)");
    expect(sql).toContain("onboarding_completed_version = greatest(onboarding_completed_version, 1)");
  });

  it("atomically accepts only increasing onboarding progress revisions", () => {
    expect(migrationName).toBeTruthy();
    const sql = readFileSync(join(migrationsDirectory, migrationName!), "utf8").toLowerCase();

    expect(sql).toContain("add column if not exists onboarding_revision bigint");
    expect(sql).toContain("create or replace function public.save_onboarding_progress");
    expect(sql).toContain("on conflict (user_id) do update");
    expect(sql).toContain("user_preferences.onboarding_revision < excluded.onboarding_revision");
    expect(sql).toContain("revoke all on function public.save_onboarding_progress");
    expect(sql).toContain("grant execute on function public.save_onboarding_progress");
  });
});
