import { describe, expect, it } from "vitest";

import { parsePromotedAdapters, shouldPromoteEvidence } from "./promotion.mjs";

describe("Scrapling adapter promotion", () => {
  it("requires both the global promotion switch and an explicit adapter allowlist", () => {
    expect(shouldPromoteEvidence({
      requestedShadow: true,
      adapters: ["greenhouse"],
      allowlist: "greenhouse",
    })).toBe(false);
    expect(shouldPromoteEvidence({
      requestedShadow: false,
      adapters: ["greenhouse"],
      allowlist: "greenhouse",
    })).toBe(true);
  });

  it("keeps mixed or unknown adapter observations in shadow mode", () => {
    expect(shouldPromoteEvidence({
      requestedShadow: false,
      adapters: ["greenhouse", "workable"],
      allowlist: "greenhouse",
    })).toBe(false);
    expect(shouldPromoteEvidence({
      requestedShadow: false,
      adapters: ["unknown"],
      allowlist: "unknown",
    })).toBe(false);
  });

  it("normalizes and limits configured adapter names", () => {
    expect([...parsePromotedAdapters(" Greenhouse,LEVER,unknown ")])
      .toEqual(["greenhouse", "lever"]);
  });
});
