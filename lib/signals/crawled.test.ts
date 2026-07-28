import { describe, expect, it } from "vitest";

import {
  buildCrawledSignal,
  normalizeCrawledObservations,
  type CrawledObservation,
} from "./crawled";

const now = new Date("2026-07-24T12:00:00.000Z");

function observation(
  overrides: Partial<CrawledObservation> = {}
): CrawledObservation {
  return {
    signal_type: "funding",
    event_type: "funding_round",
    title: "Acme raises $20M Series A",
    observed_at: "2026-07-20T00:00:00.000Z",
    source_url: "https://acme.com/news/series-a",
    evidence_text: "Acme announced a $20 million Series A.",
    confidence: 0.95,
    entity_match: "exact",
    amount_usd: 20_000_000,
    ...overrides,
  };
}

describe("crawled web evidence", () => {
  it("rejects uncertain, low-confidence, non-HTTPS, and future observations", () => {
    expect(normalizeCrawledObservations([
      observation(),
      observation({ title: "Uncertain", entity_match: "uncertain" }),
      observation({ title: "Low confidence", confidence: 0.5 }),
      observation({ title: "HTTP", source_url: "http://acme.com/news" }),
      observation({ title: "Future", observed_at: "2026-07-25T00:00:00.000Z" }),
    ], now)).toHaveLength(1);
  });

  it("deduplicates identical events and keeps the highest-confidence version", () => {
    const result = normalizeCrawledObservations([
      observation({ confidence: 0.85 }),
      observation({ confidence: 0.98 }),
    ], now);
    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(0.98);
  });

  it("scores a recent verified funding announcement deterministically", () => {
    const result = buildCrawledSignal("funding", [observation()], now.toISOString(), now);
    expect(result.status).toBe("ok");
    expect(result.score).toBe(25);
    expect(result.observed_at).toBe("2026-07-20T00:00:00.000Z");
    expect(result.evidence?.[0].source_url).toBe("https://acme.com/news/series-a");
  });

  it("reuses hiring scoring rules for dated job postings", () => {
    const result = buildCrawledSignal("hiring", [
      observation({
        signal_type: "hiring",
        event_type: "job_posting",
        title: "VP of Sales",
        job_title: "VP of Sales",
        source_url: "https://acme.com/careers/vp-sales",
      }),
    ], now.toISOString(), now);
    expect(result.status).toBe("ok");
    expect(result.score).toBeGreaterThan(0);
    expect(result.source).toBe("firecrawl");
  });

  it("keeps undated or non-scoreable crawl output unavailable instead of zero intent", () => {
    const result = buildCrawledSignal("technology", [
      observation({
        signal_type: "technology",
        event_type: "integration",
        title: "Acme integrations",
        technology_name: "Salesforce",
        technology_change: null,
      }),
    ], now.toISOString(), now);
    expect(result.status).toBe("unavailable");
    expect(result.score).toBe(0);
  });

  it("grades meaningful web changes by type and breadth", () => {
    const result = buildCrawledSignal("web_activity", [
      observation({
        signal_type: "web_activity",
        event_type: "pricing_change",
        title: "Pricing page materially changed",
        source_url: "https://acme.com/pricing",
      }),
      observation({
        signal_type: "web_activity",
        event_type: "feature_launch",
        title: "New workflow feature launched",
        source_url: "https://acme.com/changelog/workflows",
      }),
    ], now.toISOString(), now);

    expect(result.status).toBe("ok");
    expect(result.score).toBe(15);
    expect(result.metadata).toMatchObject({
      meaningful_change_count: 2,
      confidence: 0.95,
    });
  });

  it("keeps an initial web snapshot unavailable until a change is observed", () => {
    const result = buildCrawledSignal("web_activity", [], now.toISOString(), now);

    expect(result.status).toBe("unavailable");
    expect(result.metadata?.reason).toBe("no_verified_meaningful_change");
  });
});
