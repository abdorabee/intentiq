import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260823000000_user_preferences.sql"
);

describe("user preferences migration", () => {
  it("adds users.preferences as jsonb without applying remotely", () => {
    expect(existsSync(migrationPath)).toBe(true);
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();
    expect(sql).toContain("alter table");
    expect(sql).toContain("preferences");
    expect(sql).toContain("jsonb");
    expect(sql).toContain("users");
    expect(sql).not.toMatch(/insert into/i);
  });
});
