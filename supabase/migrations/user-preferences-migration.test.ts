import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20260823155702_user_preferences.sql"),
  "utf8",
).toLowerCase();

describe("user preferences migration", () => {
  it("creates one preference row per Clerk user with bounded durable state", () => {
    expect(sql).toContain("create table public.user_preferences");
    expect(sql).toContain("user_id text primary key");
    expect(sql).toContain("references public.users(id) on delete cascade");
    expect(sql).toContain("theme text not null default 'system'");
    expect(sql).toContain("theme in ('system', 'light', 'dark')");
    expect(sql).toContain("sidebar_collapsed boolean not null default false");
    expect(sql).toContain("analytics_enabled boolean not null default true");
    expect(sql).toContain("onboarding_draft jsonb not null default '{}'::jsonb");
    expect(sql).toContain("tour_status in ('not_started', 'in_progress', 'completed', 'dismissed')");
  });

  it("retains onboarding completion while adding its timestamp", () => {
    expect(sql).toContain("alter table public.users");
    expect(sql).toContain("add column if not exists onboarding_completed_at timestamptz");
    expect(sql).not.toContain("drop column onboarding_completed");
  });

  it("keeps the Clerk-owned table private while exposing it to the server client", () => {
    expect(sql).toContain("alter table public.user_preferences enable row level security");
    expect(sql).toContain("revoke all on table public.user_preferences from anon, authenticated");
    expect(sql).toContain("grant select, insert, update on table public.user_preferences to service_role");
    expect(sql).not.toContain("grant select, insert, update on table public.user_preferences to authenticated");
  });

  it("updates the row timestamp on every mutation", () => {
    expect(sql).toContain("create function public.set_user_preferences_updated_at()");
    expect(sql).toContain("new.updated_at = now()");
    expect(sql).toContain("before update on public.user_preferences");
  });
});
