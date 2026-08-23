// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ fetcher: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import { ScoreView } from "./score-view";

const signal = { score: 10, max: 20, detail: "Current signal evidence" };
const SCORE = {
  company: "Acme",
  domain: "acme.com",
  intent_score: 82,
  score_band: "HOT",
  last_updated: "2026-08-23T18:00:00.000Z",
  signals: {
    funding: signal,
    hiring: signal,
    news: signal,
    technology: signal,
    web: signal,
    github: signal,
    latestSignalDate: "2026-08-23T18:00:00.000Z",
  },
  ai_summary: "Acme has strong current purchase signals.",
  recommended_action: "Reach out this week.",
  buying_stage: "decision",
  urgency: "this-week",
  key_triggers: ["funding"],
  why_now: "Recent expansion signals.",
  email_subject: "Acme expansion",
  talk_track: "Ask about the new initiative.",
  score_decay_date: "2026-09-23T18:00:00.000Z",
  model_tier: "premium",
  scoring_version: "scoring-v2",
  score_status: "complete",
  data_coverage: 0.9,
  contributions: [],
  cached: false,
  charged: true,
  icp_fit_score: 75,
  model_fallback: false,
  automation_eligible: false,
  is_baseline: true,
  profile_hash: "profile_hash",
};

beforeEach(() => {
  harness.fetcher.mockReset();
  vi.stubGlobal("fetch", harness.fetcher);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ScoreView corrections", () => {
  it("exposes a stable tour anchor around the domain scoring flow", () => {
    render(<ScoreView creditsRemaining={10} recentScores={[]} />);
    expect(screen.getByRole("textbox", { name: "Company domain" }).closest('[data-tour="score-domain"]')).not.toBeNull();
  });

  it("rejects a blank domain visibly without sending a score request", async () => {
    const user = userEvent.setup();
    render(<ScoreView creditsRemaining={10} recentScores={[]} />);

    await user.click(screen.getByRole("button", { name: "Score" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a company domain");
    expect(harness.fetcher).not.toHaveBeenCalled();
  });

  it("surfaces the watchlist API error instead of silently swallowing it", async () => {
    const user = userEvent.setup();
    harness.fetcher
      .mockResolvedValueOnce(new Response(JSON.stringify(SCORE)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Watchlist limit reached" }), { status: 403 }));
    render(<ScoreView creditsRemaining={10} recentScores={[]} />);

    await user.type(screen.getByLabelText("Company domain"), "acme.com");
    await user.click(screen.getByRole("button", { name: "Score" }));
    await user.click(await screen.findByRole("button", { name: "Save to list" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Watchlist limit reached");
  });
});
