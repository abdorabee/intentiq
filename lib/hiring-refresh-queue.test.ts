import { describe, expect, it } from "vitest";

import {
  hiringRefreshDeduplicationId,
  hiringRefreshJobId,
} from "./hiring-refresh-queue";

describe("hiring refresh job identity", () => {
  it("deduplicates casing and surrounding whitespace", () => {
    expect(hiringRefreshJobId(" Example.COM ")).toBe(hiringRefreshJobId("example.com"));
  });

  it("does not emit BullMQ's reserved colon separator", () => {
    expect(hiringRefreshJobId("example.com")).not.toContain(":");
  });

  it("allows a new refresh after the six-hour evidence freshness window", () => {
    const start = Date.UTC(2026, 6, 15, 0, 0, 0);
    expect(hiringRefreshJobId("example.com", start))
      .not.toBe(hiringRefreshJobId("example.com", start + 6 * 60 * 60 * 1000));
  });

  it("uses a stable per-domain deduplication identity across time buckets", () => {
    expect(hiringRefreshDeduplicationId(" Example.COM "))
      .toBe(hiringRefreshDeduplicationId("example.com"));
  });
});
