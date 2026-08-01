import { describe, expect, it } from "vitest";

import {
  canonicalizeDomain,
  isCompanyOwnedHttpsUrl,
  normalizeExtractedObservations,
  selectCandidateUrls,
} from "./sources.mjs";

describe("web enrichment source boundaries", () => {
  it("accepts only canonical public company domains", () => {
    expect(canonicalizeDomain("https://www.Acme.com/path")).toBe("acme.com");
    expect(() => canonicalizeDomain("127.0.0.1")).toThrow();
    expect(() => canonicalizeDomain("localhost")).toThrow();
  });

  it("keeps discovery on HTTPS company-owned hosts", () => {
    expect(isCompanyOwnedHttpsUrl("https://news.acme.com/post", "acme.com")).toBe(true);
    expect(isCompanyOwnedHttpsUrl("http://acme.com/post", "acme.com")).toBe(false);
    expect(isCompanyOwnedHttpsUrl("https://acme.com.attacker.test/post", "acme.com")).toBe(false);
  });

  it("selects relevant URLs and excludes external links", () => {
    const urls = selectCandidateUrls([
      { url: "https://acme.com/careers", title: "Careers" },
      { url: "https://acme.com/news", title: "Newsroom" },
      { url: "https://attacker.test/news", title: "News" },
      { url: "https://acme.com/privacy", title: "Privacy" },
    ], "acme.com");
    expect(urls).toContain("https://acme.com/careers");
    expect(urls).toContain("https://acme.com/news");
    expect(urls.some((url) => url.includes("attacker.test"))).toBe(false);
    expect(urls.some((url) => url.includes("/privacy"))).toBe(false);
  });

  it("caps account scraping at five pages and targets requested signals", () => {
    const links = [
      "https://acme.com/pricing",
      "https://acme.com/changelog",
      "https://acme.com/integrations",
      "https://acme.com/product",
      "https://acme.com/careers",
      "https://acme.com/jobs",
      "https://acme.com/news",
      "https://acme.com/blog",
    ];
    const technologyUrls = selectCandidateUrls(
      links,
      "acme.com",
      ["technology", "web_activity"]
    );

    expect(technologyUrls).toHaveLength(5);
    expect(technologyUrls).toContain("https://acme.com/pricing");
    expect(technologyUrls.some((url) => /careers|jobs/.test(url))).toBe(false);
  });

  it("drops mismatched and low-confidence extracted events", () => {
    const pages = [{
      metadata: { sourceURL: "https://acme.com/news" },
      json: {
        events: [
          {
            signal_type: "funding",
            event_type: "funding_round",
            title: "Acme raises a round",
            observed_at: "2026-07-20",
            confidence: 0.95,
            entity_match: "exact",
          },
          {
            signal_type: "news",
            event_type: "launch",
            title: "Uncertain launch",
            observed_at: "2026-07-20",
            confidence: 0.4,
            entity_match: "exact",
          },
        ],
      },
    }];
    expect(normalizeExtractedObservations(
      pages,
      "acme.com",
      ["funding", "news"],
      new Date("2026-07-24T12:00:00Z")
    )).toHaveLength(1);
  });
});
