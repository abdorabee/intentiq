import { afterEach, describe, expect, it, vi } from "vitest";

import { generateReasoning } from "./reasoning";
import type { SignalResult, SignalSet } from "./types";

function noSignal(max: number, detail: string): SignalResult {
  return {
    score: 0,
    max,
    detail,
    status: "no_signal",
    observed_at: null,
    fetched_at: "2026-07-15T12:00:00.000Z",
    source: "test",
    evidence: [],
  };
}

describe("deterministic reasoning fallback", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const quietSignals = (): SignalSet => ({
    funding: noSignal(25, "No recent funding found"),
    hiring: noSignal(20, "No recent hiring events found"),
    news: noSignal(20, "No qualifying news found"),
    technology: noSignal(20, "No recent technology adoption found"),
    web: noSignal(15, "No web context found"),
    github: noSignal(20, "No GitHub context found"),
    latestSignalDate: "2026-07-15T12:00:00.000Z",
  });

  it("does not invent a trigger when all verified trigger sources are quiet", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const signals = quietSignals();

    const result = await generateReasoning("Acme", 0, "COLD", signals, "B2B SaaS");

    expect(result.key_triggers).toEqual([]);
    expect(result.ai_summary).toContain("no qualifying time-bound purchase trigger");
    expect(result.why_now).toContain("No verified time-bound trigger");
    expect(result.talk_track.toLowerCase()).not.toContain("noticed");
    expect(result.used_fallback).toBe(true);
  });

  it("aborts a slow AI request and returns the deterministic fallback", async () => {
    vi.useFakeTimers();
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })
    ));

    const pending = generateReasoning("Acme", 0, "COLD", quietSignals(), "B2B SaaS");
    await vi.advanceTimersByTimeAsync(12_001);
    const result = await pending;

    expect(result.used_fallback).toBe(true);
    expect(result.key_triggers).toEqual([]);
  });
});
