import { describe, expect, it } from "vitest";

import { parsePromotedSignals, shouldPromoteSignal } from "./promotion.mjs";

const observation = {
  signal_type: "funding",
  confidence: 0.95,
  entity_match: "exact",
};

describe("web enrichment promotion", () => {
  it("requires both the global switch and per-signal approval", () => {
    expect(shouldPromoteSignal({
      requestedShadow: true,
      signal: "funding",
      observations: [observation],
      allowlist: "funding",
    })).toBe(false);
    expect(shouldPromoteSignal({
      requestedShadow: false,
      signal: "funding",
      observations: [observation],
      allowlist: "funding",
    })).toBe(true);
  });

  it("rejects low-confidence or mismatched observations", () => {
    expect(shouldPromoteSignal({
      requestedShadow: false,
      signal: "funding",
      observations: [{ ...observation, confidence: 0.5 }],
      allowlist: "funding",
    })).toBe(false);
    expect(shouldPromoteSignal({
      requestedShadow: false,
      signal: "funding",
      observations: [{ ...observation, entity_match: "mismatch" }],
      allowlist: "funding",
    })).toBe(false);
  });

  it("normalizes and limits configured signal names", () => {
    expect([...parsePromotedSignals(" Funding,NEWS,unknown ")])
      .toEqual(["funding", "news"]);
  });
});
