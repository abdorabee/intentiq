import { describe, expect, it } from "vitest";
import {
  computeActiveIntentScore,
  computeFreshness,
  computeIntentScore,
  getActiveScoringVersion,
  LEGACY_SCORING_VERSION,
  SCORING_VERSION,
} from "./scorer";
import type { SignalResult, SignalSet, SignalStatus } from "./types";

const NOW = new Date("2026-07-15T12:00:00.000Z");

function observedDaysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function signal(
  score: number,
  max: number,
  status: SignalStatus = score > 0 ? "ok" : "no_signal",
  daysAgo: number | null = score > 0 ? 0 : null
): SignalResult {
  return {
    score,
    max,
    detail: `${status} fixture`,
    status,
    observed_at: daysAgo === null ? null : observedDaysAgo(daysAgo),
    fetched_at: NOW.toISOString(),
    evidence: [],
  };
}

function signalSet(overrides: Partial<SignalSet> = {}): SignalSet {
  return {
    funding: signal(0, 25),
    hiring: signal(0, 20),
    news: signal(0, 20),
    technology: signal(0, 20),
    web: signal(0, 15),
    github: signal(0, 20),
    latestSignalDate: NOW.toISOString(),
    ...overrides,
  };
}

function score(signals: SignalSet) {
  return computeIntentScore("Acme", "acme.test", signals, NOW);
}

describe("computeIntentScore v2", () => {
  it("maps complete all-zero, half-strength, and maximum fixtures to 0, 50, and 100", () => {
    const at = (fraction: number) => score(signalSet({
      funding: signal(25 * fraction, 25),
      hiring: signal(20 * fraction, 20),
      news: signal(20 * fraction, 20),
      technology: signal(20 * fraction, 20),
    }));

    expect(at(0).intent_score).toBe(0);
    expect(at(0.5).intent_score).toBe(50);
    expect(at(1).intent_score).toBe(100);
  });

  it("keeps a saturated four-trigger engine behind an explicit rollback flag", () => {
    const fixture = signalSet({
      funding: signal(12.5, 25),
      hiring: signal(10, 20),
      news: signal(10, 20),
      technology: signal(10, 20),
    });
    const rolledBack = computeActiveIntentScore("Acme", "acme.test", fixture, NOW, false);

    expect(getActiveScoringVersion("false")).toBe(LEGACY_SCORING_VERSION);
    expect(getActiveScoringVersion("true")).toBe(SCORING_VERSION);
    expect(rolledBack.scoring_version).toBe(LEGACY_SCORING_VERSION);
    expect(rolledBack.intent_score).not.toBe(score(fixture).intent_score);
    expect(rolledBack.contributions.map((item) => item.type))
      .toEqual(["funding", "hiring", "news", "technology"]);
    expect(rolledBack.contributions.reduce((sum, item) => sum + item.contribution, 0))
      .toBeCloseTo(rolledBack.intent_score ?? 0, 3);
  });

  it("keeps Web and GitHub context out of the rollback score", () => {
    const triggers = {
      funding: signal(12.5, 25),
      hiring: signal(10, 20),
      news: signal(10, 20),
      technology: signal(10, 20),
    };
    const baseline = computeActiveIntentScore(
      "Acme",
      "acme.test",
      signalSet(triggers),
      NOW,
      false
    );
    const contextHeavy = computeActiveIntentScore(
      "Acme",
      "acme.test",
      signalSet({
        ...triggers,
        web: signal(15, 15, "ok", 0),
        github: signal(20, 20, "ok", 0),
      }),
      NOW,
      false
    );

    expect(contextHeavy.intent_score).toBe(baseline.intent_score);
    expect(contextHeavy.raw_score).toBe(baseline.raw_score);
    expect(contextHeavy.contributions).toEqual(baseline.contributions);
  });

  it("keeps provider outages from becoming zero intent in rollback mode", () => {
    const available = computeActiveIntentScore(
      "Acme",
      "acme.test",
      signalSet({
        funding: signal(0, 25, "no_signal", null),
        hiring: signal(20, 20),
      }),
      NOW,
      false
    );
    const outage = computeActiveIntentScore(
      "Acme",
      "acme.test",
      signalSet({
        funding: signal(0, 25, "unavailable", null),
        hiring: signal(20, 20),
      }),
      NOW,
      false
    );

    expect(outage.score_status).toBe("partial");
    expect(outage.data_coverage).toBeCloseTo(55 / 77, 4);
    expect(outage.intent_score).not.toBeNull();
    expect(outage.intent_score).toBeGreaterThanOrEqual(available.intent_score ?? 0);
  });

  it("keeps the rollback path unscorable below minimum coverage", () => {
    const result = computeActiveIntentScore(
      "Acme",
      "acme.test",
      signalSet({
        funding: signal(0, 25, "unavailable", null),
        hiring: signal(0, 20, "unavailable", null),
      }),
      NOW,
      false
    );

    expect(result.score_status).toBe("unscorable");
    expect(result.intent_score).toBeNull();
    expect(result.score_band).toBeNull();
  });

  it("uses a monotonic weighted average without spread or combination jumps", () => {
    const result = score(signalSet({
      funding: signal(12.5, 25),
      hiring: signal(10, 20),
      news: signal(10, 20),
      technology: signal(10, 20),
    }));

    expect(result.intent_score).toBe(50);
    expect(result.score_band).toBe("WARM");
    expect(result.raw_score).toBe(50);
    expect(result.score_status).toBe("complete");
    expect(result.data_coverage).toBe(1);
    expect(result.scoring_version).toBe(SCORING_VERSION);
  });

  it("lets one strong trigger contribute proportionally instead of collapsing to zero", () => {
    const fundingOnly = score(signalSet({ funding: signal(25, 25) }));
    const fundingAndHiring = score(signalSet({
      funding: signal(25, 25),
      hiring: signal(20, 20),
    }));

    expect(fundingOnly.intent_score).toBe(29);
    expect(fundingOnly.score_band).toBe("COLD");
    expect(fundingAndHiring.intent_score).toBe(53);
    expect(fundingAndHiring.score_band).toBe("WARM");
  });

  it("changes smoothly when a tiny third signal is added", () => {
    const baseline = score(signalSet({
      funding: signal(25, 25),
      hiring: signal(20, 20),
    }));
    const withTinyNews = score(signalSet({
      funding: signal(25, 25),
      hiring: signal(20, 20),
      news: signal(0.001, 20),
    }));

    expect(withTinyNews.intent_score).toBe(baseline.intent_score);
  });

  it("applies documented 15% monthly freshness continuously", () => {
    expect(computeFreshness(0)).toBe(1);
    expect(computeFreshness(30)).toBeCloseTo(0.85, 8);
    expect(computeFreshness(60)).toBeCloseTo(0.7225, 8);

    const day30 = score(signalSet({
      funding: signal(25, 25, "ok", 30),
      hiring: signal(20, 20, "ok", 30),
      news: signal(20, 20, "ok", 30),
      technology: signal(20, 20, "ok", 30),
    }));
    const day31 = score(signalSet({
      funding: signal(25, 25, "ok", 31),
      hiring: signal(20, 20, "ok", 31),
      news: signal(20, 20, "ok", 31),
      technology: signal(20, 20, "ok", 31),
    }));

    expect(day30.intent_score).toBe(85);
    expect(day31.intent_score).toBe(85);
  });

  it("decays each trigger from its own observation time", () => {
    const result = score(signalSet({
      funding: signal(25, 25, "ok", 30),
      hiring: signal(20, 20),
      news: signal(20, 20),
      technology: signal(20, 20),
    }));

    expect(result.intent_score).toBe(96);
    expect(result.contributions.find((item) => item.type === "funding")?.freshness)
      .toBeCloseTo(0.85, 6);
    expect(result.contributions.find((item) => item.type === "hiring")?.freshness).toBe(1);
  });

  it("treats verified no-signal sources as full coverage", () => {
    const result = score(signalSet());

    expect(result.intent_score).toBe(0);
    expect(result.score_band).toBe("COLD");
    expect(result.data_coverage).toBe(1);
    expect(result.score_status).toBe("complete");
    expect(result.confidence).toBe(1);
  });

  it("weights stale sources at half coverage and score weight", () => {
    const result = score(signalSet({
      funding: signal(25, 25, "stale", 0),
    }));

    expect(result.data_coverage).toBe(0.8571);
    expect(result.score_status).toBe("partial");
    expect(result.intent_score).toBe(17);
    expect(result.contributions.find((item) => item.type === "funding")?.effectiveWeight).toBe(11);
  });

  it("returns a partial score above 60% coverage and null below it", () => {
    const partial = score(signalSet({
      funding: signal(0, 25, "unavailable", null),
    }));
    const unscorable = score(signalSet({
      funding: signal(0, 25, "unavailable", null),
      hiring: signal(0, 20, "unavailable", null),
    }));

    expect(partial.data_coverage).toBe(0.7143);
    expect(partial.score_status).toBe("partial");
    expect(partial.intent_score).toBe(0);
    expect(unscorable.data_coverage).toBe(0.4675);
    expect(unscorable.score_status).toBe("unscorable");
    expect(unscorable.intent_score).toBeNull();
    expect(unscorable.score_band).toBeNull();
    expect(unscorable.raw_score).toBeNull();
  });

  it("rejects malformed numeric inputs and undated positive v2 evidence", () => {
    const malformed = score(signalSet({
      funding: {
        score: Number.NaN,
        max: 0,
        detail: "bad vendor payload",
        status: "ok",
        observed_at: NOW.toISOString(),
      },
      hiring: {
        score: 20,
        max: 20,
        detail: "undated positive payload",
        status: "ok",
        observed_at: null,
      },
    }));

    expect(malformed.contributions.find((item) => item.type === "funding")?.status)
      .toBe("unavailable");
    expect(malformed.contributions.find((item) => item.type === "hiring")?.status)
      .toBe("unavailable");
    expect(malformed.score_status).toBe("unscorable");
    expect(malformed.intent_score).toBeNull();
  });

  it("rejects future-dated positive evidence beyond clock-skew tolerance", () => {
    const result = score(signalSet({
      funding: {
        score: 25,
        max: 25,
        detail: "impossible future funding event",
        status: "ok",
        observed_at: "2099-01-01T00:00:00.000Z",
        fetched_at: NOW.toISOString(),
      },
    }));

    expect(result.contributions.find((item) => item.type === "funding")).toMatchObject({
      status: "unavailable",
      rawScore: 0,
      freshness: 0,
      observedAt: null,
    });
    expect(result.intent_score).toBe(0);
  });

  it("uses latestSignalDate only for legacy payloads", () => {
    const legacy = signalSet({
      funding: { score: 25, max: 25, detail: "legacy funding" },
      hiring: { score: 20, max: 20, detail: "legacy hiring" },
      news: { score: 20, max: 20, detail: "legacy news" },
      technology: { score: 20, max: 20, detail: "legacy technology" },
      latestSignalDate: observedDaysAgo(30),
    });

    expect(score(legacy).intent_score).toBe(85);
  });

  it("keeps exact band boundaries", () => {
    const at = (percent: number) => score(signalSet({
      funding: signal(25 * percent / 100, 25),
      hiring: signal(20 * percent / 100, 20),
      news: signal(20 * percent / 100, 20),
      technology: signal(20 * percent / 100, 20),
    }));

    expect(at(49).score_band).toBe("COLD");
    expect(at(50).score_band).toBe("WARM");
    expect(at(74).score_band).toBe("WARM");
    expect(at(75).score_band).toBe("HOT");
  });

  it("excludes web and GitHub context from score and coverage", () => {
    const baseline = score(signalSet());
    const contextHeavy = score(signalSet({
      web: signal(15, 15, "ok", 0),
      github: signal(20, 20, "ok", 0),
    }));
    const contextUnavailable = score(signalSet({
      web: signal(0, 15, "unavailable", null),
      github: signal(0, 20, "unavailable", null),
    }));

    expect(contextHeavy.intent_score).toBe(baseline.intent_score);
    expect(contextUnavailable.intent_score).toBe(baseline.intent_score);
    expect(contextUnavailable.data_coverage).toBe(1);
    expect(contextHeavy.contributions.map((item) => item.type))
      .toEqual(["funding", "hiring", "news", "technology"]);
  });
});
