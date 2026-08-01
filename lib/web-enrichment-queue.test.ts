import { describe, expect, it } from "vitest";

import {
  WEB_ENRICHMENT_SIGNAL_KEYS,
  webEnrichmentSignalsForStatuses,
  webEnrichmentDeduplicationId,
  webEnrichmentJobId,
} from "./web-enrichment-queue";

describe("web enrichment queue identifiers", () => {
  it("targets web activity and avoids broad funding crawling by default", () => {
    expect(WEB_ENRICHMENT_SIGNAL_KEYS).toEqual([
      "hiring",
      "news",
      "technology",
      "web_activity",
    ]);
  });

  it("adds funding only for an explicit structured-provider fallback", () => {
    expect(webEnrichmentSignalsForStatuses({ funding: "unavailable" }, false))
      .toEqual([...WEB_ENRICHMENT_SIGNAL_KEYS]);
    expect(webEnrichmentSignalsForStatuses({ funding: "unavailable" }, true))
      .toEqual([...WEB_ENRICHMENT_SIGNAL_KEYS, "funding"]);
    expect(webEnrichmentSignalsForStatuses({ funding: "ok" }, true))
      .toEqual([...WEB_ENRICHMENT_SIGNAL_KEYS]);
  });

  it("deduplicates a domain within a six-hour freshness bucket", () => {
    const start = Date.UTC(2026, 6, 24, 0, 0, 0);
    expect(webEnrichmentJobId("Example.COM", start))
      .toBe(webEnrichmentJobId("example.com", start + 60_000));
    expect(webEnrichmentJobId("example.com", start))
      .not.toBe(webEnrichmentJobId("example.com", start + 6 * 60 * 60 * 1000));
  });

  it("uses a stable domain-level deduplication key", () => {
    expect(webEnrichmentDeduplicationId(" Example.COM "))
      .toBe("web-enrichment-v1-example.com");
  });
});
