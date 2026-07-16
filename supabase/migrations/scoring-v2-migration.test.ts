import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  new URL("./20260715000000_scoring_v2_pipeline.sql", import.meta.url),
  "utf8"
);

describe("scoring v2 transactional migration invariants", () => {
  it("serializes per-user reservations and never spends a fractional last credit", () => {
    expect(sql).toContain("pg_advisory_xact_lock(hashtextextended(p_user_id, 0))");
    expect(sql).toMatch(/if v_credits < 1 then/);
    expect(sql).toMatch(/and u\.credits_remaining >= 1\s+returning u\.credits_remaining/);
  });

  it("makes the debit log exact-once per score run", () => {
    expect(sql).toContain("credits_log_score_run_id_key");
    expect(sql).toMatch(/insert into public\.credits_log[\s\S]*on conflict do nothing/);
  });

  it("refunds only a live reservation on failed or unscorable completion", () => {
    const match = sql.match(
      /create or replace function public\.fail_score_run[\s\S]*?\n\$\$;/
    );
    expect(match).not.toBeNull();
    const failure = match?.[0] ?? "";

    expect(failure).toContain(
      "pg_advisory_xact_lock(hashtextextended(v_run.user_id, 0))"
    );
    expect(failure).toMatch(/if v_run\.credit_reserved then[\s\S]*credits_remaining = u\.credits_remaining \+ 1/);
    expect(failure).toMatch(/status = v_status[\s\S]*credit_reserved = false/);
  });

  it("captures the prior same-version score before inserting the new baseline", () => {
    const priorRead = sql.indexOf("into v_previous_v2_score, v_previous_v2_band");
    const scoreInsert = sql.indexOf("insert into public.scores", priorRead);

    expect(priorRead).toBeGreaterThan(-1);
    expect(scoreInsert).toBeGreaterThan(priorRead);
    expect(sql).toContain("'previous_v2_score', v_previous_v2_score");
  });

  it("reaps stale runs under a non-blocking per-user lock with exact refunds", () => {
    const match = sql.match(
      /create or replace function public\.reap_stale_score_runs[\s\S]*?\n\$\$;/
    );
    expect(match).not.toBeNull();
    const reaper = match?.[0] ?? "";

    expect(reaper).toContain("pg_try_advisory_xact_lock(hashtextextended(v_candidate.user_id, 0))");
    expect(reaper).toMatch(/where sr\.status = 'running'[\s\S]*interval '15 minutes'/);
    expect(reaper).toMatch(/returning target\.credit_reserved/);
    expect(reaper).toMatch(/credit_reserved = false/);
    expect(reaper).toMatch(/credits_remaining = u\.credits_remaining \+ v_refunds/);
  });

  it("bounds reaper work and keeps the RPC service-role only", () => {
    expect(sql).toContain("score_runs_stale_reaper_idx");
    expect(sql).toMatch(/p_user_batch_size < 1 or p_user_batch_size > 1000/);
    expect(sql).toMatch(/limit p_user_batch_size/);
    expect(sql).toContain(
      "revoke all on function public.reap_stale_score_runs(integer) from authenticated"
    );
    expect(sql).toContain(
      "grant execute on function public.reap_stale_score_runs(integer) to service_role"
    );
  });

  it("keeps every scoring mutation RPC service-role only", () => {
    for (const signature of [
      "persist_signal_evidence(jsonb)",
      "begin_score_run(text, text, text, text, text, text, text, boolean, boolean)",
      "complete_score_run(uuid, jsonb, jsonb)",
      "fail_score_run(uuid, text, text, boolean, jsonb, jsonb)",
    ]) {
      expect(sql).toContain(
        `revoke all on function public.${signature} from anon, authenticated`
      );
      expect(sql).toContain(
        `grant execute on function public.${signature} to service_role`
      );
    }
  });

  it("schedules stale-run recovery when Supabase Cron is enabled", () => {
    expect(sql).toMatch(/extname = 'pg_cron'[\s\S]*cron\.schedule/);
    expect(sql).toContain("'scoring-v2-stale-run-reaper'");
    expect(sql).toContain("'*/5 * * * *'");
    expect(sql).toContain("select * from public.reap_stale_score_runs(100)");
  });
});
