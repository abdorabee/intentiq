import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260824000000_chat_ui_blocks.sql"
);

describe("chat ui_blocks migration", () => {
  it("adds chat_messages.ui_blocks as jsonb without applying remotely", () => {
    expect(existsSync(migrationPath)).toBe(true);
    const sql = readFileSync(migrationPath, "utf8").toLowerCase();
    expect(sql).toContain("alter table");
    expect(sql).toContain("ui_blocks");
    expect(sql).toContain("jsonb");
    expect(sql).toContain("chat_messages");
    expect(sql).not.toMatch(/insert into/i);
  });
});
