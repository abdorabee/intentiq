import { describe, expect, it } from "vitest";
import { detectMeaningfulWebChanges } from "./changes.mjs";

const fetchedAt = "2026-07-27T12:00:00.000Z";

function page(url, markdown) {
  return {
    markdown,
    metadata: {
      sourceURL: url,
      title: "Acme",
    },
  };
}

describe("meaningful web change detection", () => {
  it("creates a baseline without emitting intent", () => {
    const result = detectMeaningfulWebChanges({
      domain: "acme.com",
      pages: [page("https://acme.com/pricing", "Starter plan is $20 per month. ".repeat(8))],
      previousSnapshots: [],
      fetchedAt,
    });

    expect(result.observations).toEqual([]);
    expect(result.snapshots).toHaveLength(1);
    expect(result.snapshots[0]).toMatchObject({
      canonical_domain: "acme.com",
      source_url: "https://acme.com/pricing",
    });
  });

  it("emits a graded pricing change only after a material delta", () => {
    const baseline = detectMeaningfulWebChanges({
      domain: "acme.com",
      pages: [page("https://acme.com/pricing", "Starter plan is $20 per month. ".repeat(8))],
      previousSnapshots: [],
      fetchedAt: "2026-07-20T12:00:00.000Z",
    });
    const result = detectMeaningfulWebChanges({
      domain: "acme.com",
      pages: [page(
        "https://acme.com/pricing",
        "Growth plan is $99 with automation, integrations, analytics, and unlimited seats. ".repeat(8)
      )],
      previousSnapshots: baseline.snapshots,
      fetchedAt,
    });

    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]).toMatchObject({
      signal_type: "web_activity",
      event_type: "pricing_change",
      source_url: "https://acme.com/pricing",
      observed_at: fetchedAt,
      entity_match: "exact",
    });
    expect(result.observations[0].confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("ignores cosmetic text changes below the materiality threshold", () => {
    const baseline = detectMeaningfulWebChanges({
      domain: "acme.com",
      pages: [page("https://acme.com/blog/post", "Product update and customer story. ".repeat(12))],
      previousSnapshots: [],
      fetchedAt: "2026-07-20T12:00:00.000Z",
    });
    const result = detectMeaningfulWebChanges({
      domain: "acme.com",
      pages: [page("https://acme.com/blog/post", `Product update and customer story. ${"Product update and customer story. ".repeat(11)}`)],
      previousSnapshots: baseline.snapshots,
      fetchedAt,
    });

    expect(result.observations).toEqual([]);
  });

  it("rejects pages outside the company domain", () => {
    const result = detectMeaningfulWebChanges({
      domain: "acme.com",
      pages: [page("https://evil.example/pricing", "Changed pricing details. ".repeat(12))],
      previousSnapshots: [],
      fetchedAt,
    });

    expect(result.snapshots).toEqual([]);
  });
});
