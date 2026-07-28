import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20260727000000_scoring_v3.sql"),
  "utf8"
).toLowerCase();

describe("scoring v3 migration", () => {
  it("adds versioned policies and score snapshot metadata", () => {
    expect(sql).toContain("create table if not exists public.scoring_policies");
    expect(sql).toContain("scoring_policy_id");
    expect(sql).toContain("scoring_policy");
    expect(sql).toContain("signal_coverage");
    expect(sql).toContain("sync_scoring_v3_metadata");
    expect(sql).toContain("create table if not exists public.score_shadow_results");
  });

  it("adds immutable outcome labels tied to an exact score", () => {
    expect(sql).toContain("create table if not exists public.score_outcomes");
    expect(sql).toContain("references public.scores(id)");
    expect(sql).toContain("'closed_won', 'closed_lost', 'no_decision', 'disqualified'");
    expect(sql).toContain("unique (score_id)");
  });

  it("adds bounded Firecrawl map, snapshot, and run telemetry storage", () => {
    expect(sql).toContain("create table if not exists public.web_enrichment_maps");
    expect(sql).toContain("create table if not exists public.web_page_snapshots");
    expect(sql).toContain("create table if not exists public.web_enrichment_runs");
    expect(sql).toContain("unique (canonical_domain, source_url)");
  });

  it("enables RLS on every new table", () => {
    for (const table of [
      "scoring_policies",
      "score_shadow_results",
      "score_outcomes",
      "web_enrichment_maps",
      "web_page_snapshots",
      "web_enrichment_runs",
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });
});
