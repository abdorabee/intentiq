import { describe, expect, it } from "vitest";

import { hydrateThemePreference } from "./theme";
import {
  DEFAULT_USER_PREFERENCES,
  mergeUserPreferences,
  normalizeUserPreferences,
  parsePreferencesPatch,
  readExplicitThemePreference,
  toPreferencesResponse,
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
      onboarding_step: 0,
      onboarding_draft: null,
    });
  });
});

describe("readExplicitThemePreference", () => {
  it("returns only a theme that was actually stored", () => {
    expect(readExplicitThemePreference({})).toBeUndefined();
    expect(readExplicitThemePreference(null)).toBeUndefined();
    expect(readExplicitThemePreference({ product_tour_completed: true })).toBeUndefined();
    expect(readExplicitThemePreference({ theme: "neon" })).toBeUndefined();
    expect(readExplicitThemePreference({ theme: "light" })).toBe("light");
    expect(readExplicitThemePreference({ theme: "dark" })).toBe("dark");
    expect(readExplicitThemePreference({ theme: "system" })).toBe("system");
  });
});

describe("toPreferencesResponse", () => {
  it("omits theme from empty DB preferences so GET does not default-fill dark", () => {
    expect(toPreferencesResponse({}).preferences.theme).toBeUndefined();
    expect(toPreferencesResponse({}).preferences).toEqual({
      product_tour_completed: false,
      product_tour_version: 1,
    });
  });

  it("includes an explicit stored theme, including dark", () => {
    expect(toPreferencesResponse({ theme: "dark" }).preferences.theme).toBe("dark");
    expect(toPreferencesResponse({ theme: "light" }).preferences.theme).toBe("light");
  });

  it("does not let a default-filled empty row overwrite a local light or system cache", () => {
    const emptyGet = toPreferencesResponse({}).preferences;
    expect(normalizeUserPreferences({}).theme).toBe("dark");
    expect(emptyGet.theme).toBeUndefined();
    expect(hydrateThemePreference("light", emptyGet)).toBe("light");
    expect(hydrateThemePreference("system", emptyGet)).toBe("system");
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

  it("accepts an onboarding persist payload", () => {
    const result = parsePreferencesPatch({
      onboarding_step: 2,
      onboarding_draft: {
        product_category: "SaaS / Software",
        target_industries: ["Technology"],
        company_size: "SMB (51-200)",
        buyer_role: "",
        sales_motion: "",
        deal_size: "",
        sales_cycle: "",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an onboarding step outside the wizard", () => {
    expect(parsePreferencesPatch({ onboarding_step: 5 }).success).toBe(false);
    expect(parsePreferencesPatch({ onboarding_step: -1 }).success).toBe(false);
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
      onboarding_step: 0,
      onboarding_draft: null,
    });
  });

  it("fills defaults when merging onto an empty stored object", () => {
    expect(mergeUserPreferences({}, { theme: "light" })).toEqual({
      ...DEFAULT_USER_PREFERENCES,
      theme: "light",
    });
  });
});
