import { describe, expect, it } from "vitest";
import { evidenceRowsForResult } from "./evidence.mjs";

const fetchedAt = "2026-07-27T12:00:00.000Z";

function observation(overrides = {}) {
  return {
    signal_type: "web_activity",
    event_type: "pricing_change",
    title: "Pricing page materially changed",
    observed_at: fetchedAt,
    source_url: "https://acme.com/pricing",
    confidence: 0.95,
    entity_match: "exact",
    ...overrides,
  };
}

describe("Firecrawl evidence persistence rows", () => {
  it("keeps an empty bounded crawl unavailable rather than zero intent", () => {
    const [row] = evidenceRowsForResult({
      domain: "acme.com",
      schemaVersion: "web-enrichment-v1",
      signals: ["web_activity"],
      observations: [],
      requestedShadow: false,
      promotedSignals: "web_activity",
      fetchedAt,
      firecrawlMetadata: { page_count: 2 },
    });

    expect(row.status).toBe("unavailable");
    expect(row.shadow).toBe(true);
    expect(row.observed_at).toBeNull();
  });

  it("promotes only allowlisted exact high-confidence evidence", () => {
    const [row] = evidenceRowsForResult({
      domain: "acme.com",
      schemaVersion: "web-enrichment-v1",
      signals: ["web_activity"],
      observations: [observation()],
      requestedShadow: false,
      promotedSignals: "web_activity",
      fetchedAt,
      firecrawlMetadata: { page_count: 2 },
    });

    expect(row.status).toBe("ok");
    expect(row.shadow).toBe(false);
    expect(row.raw_payload.observations).toHaveLength(1);
    expect(row.evidence[0].source_url).toBe("https://acme.com/pricing");
  });
});
