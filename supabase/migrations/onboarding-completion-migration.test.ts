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
  });

  it("backfills legacy completed users without changing incomplete users", () => {
    expect(migrationName).toBeTruthy();
    const sql = readFileSync(join(migrationsDirectory, migrationName!), "utf8").toLowerCase();

    expect(sql).toContain("where onboarding_completed = true");
    expect(sql).toContain("onboarding_completed_at = coalesce(onboarding_completed_at, created_at)");
    expect(sql).toContain("onboarding_completed_version = 1");
  });
});
