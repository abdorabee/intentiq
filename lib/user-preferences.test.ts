import { describe, expect, it } from "vitest";

import {
  DEFAULT_USER_PREFERENCES,
  mergeUserPreferences,
  normalizeUserPreferences,
  parsePreferencesPatch,
} from "./user-preferences";

describe("normalizeUserPreferences", () => {
  it("returns dark defaults for missing or invalid payloads", () => {
    expect(normalizeUserPreferences(null)).toEqual(DEFAULT_USER_PREFERENCES);
    expect(normalizeUserPreferences(undefined)).toEqual(DEFAULT_USER_PREFERENCES);
    expect(normalizeUserPreferences("dark")).toEqual(DEFAULT_USER_PREFERENCES);
    expect(normalizeUserPreferences({ theme: "neon", product_tour_completed: "yes" })).toEqual(
      DEFAULT_USER_PREFERENCES
    );
  });

  it("keeps a valid persisted preference object", () => {
    expect(
      normalizeUserPreferences({
        theme: "system",
        product_tour_completed: true,
        product_tour_version: 2,
        extra: "ignored",
      })
    ).toEqual({
      theme: "system",
      product_tour_completed: true,
      product_tour_version: 2,
    });
  });
});

describe("parsePreferencesPatch", () => {
  it("accepts a partial theme update", () => {
    const result = parsePreferencesPatch({ theme: "light" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ theme: "light" });
    }
  });

  it("accepts a tour restart payload", () => {
    const result = parsePreferencesPatch({ product_tour_completed: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ product_tour_completed: false });
    }
  });

  it("rejects empty, unknown, or invalid fields", () => {
    expect(parsePreferencesPatch({}).success).toBe(false);
    expect(parsePreferencesPatch({ theme: "sepia" }).success).toBe(false);
    expect(parsePreferencesPatch({ density: "compact" }).success).toBe(false);
    expect(parsePreferencesPatch({ product_tour_version: 0 }).success).toBe(false);
  });
});

describe("mergeUserPreferences", () => {
  it("merges a patch onto existing preferences without dropping other fields", () => {
    expect(
      mergeUserPreferences(
        {
          theme: "system",
          product_tour_completed: true,
          product_tour_version: 1,
        },
        { product_tour_completed: false }
      )
    ).toEqual({
      theme: "system",
      product_tour_completed: false,
      product_tour_version: 1,
    });
  });

  it("fills defaults when merging onto an empty stored object", () => {
    expect(mergeUserPreferences({}, { theme: "light" })).toEqual({
      ...DEFAULT_USER_PREFERENCES,
      theme: "light",
    });
  });
});
