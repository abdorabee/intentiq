import { describe, expect, it } from "vitest";
import {
  canStartPageJob,
  isMapFresh,
  startOfUtcDayIso,
} from "./limits.mjs";

describe("web enrichment runtime limits", () => {
  it("uses UTC day boundaries for the daily page budget", () => {
    expect(startOfUtcDayIso(new Date("2026-07-27T23:59:59-04:00")))
      .toBe("2026-07-28T00:00:00.000Z");
  });

  it("reserves the full per-account page cap before starting", () => {
    expect(canStartPageJob({ usedPages: 1495, dailyBudget: 1500, requestedPages: 5 }))
      .toBe(true);
    expect(canStartPageJob({ usedPages: 1496, dailyBudget: 1500, requestedPages: 5 }))
      .toBe(false);
  });

  it("reuses maps for seven days but not beyond the boundary", () => {
    const now = new Date("2026-07-27T12:00:00.000Z");
    expect(isMapFresh("2026-07-20T12:00:00.000Z", now)).toBe(true);
    expect(isMapFresh("2026-07-20T11:59:59.999Z", now)).toBe(false);
    expect(isMapFresh("invalid", now)).toBe(false);
  });
});
