import { describe, expect, it } from "vitest";
import {
  userPreferencesPatchSchema,
  userPreferencesRowSchema,
} from "./user-preferences";

describe("user preference contracts", () => {
  it("preserves explicit false values in partial updates", () => {
    expect(userPreferencesPatchSchema.parse({
      sidebar_collapsed: false,
      analytics_enabled: false,
    })).toEqual({
      sidebar_collapsed: false,
      analytics_enabled: false,
    });
  });

  it("rejects unknown and server-owned fields", () => {
    expect(() => userPreferencesPatchSchema.parse({ theme: "dark", surprise: true })).toThrow();
    expect(() => userPreferencesPatchSchema.parse({ user_id: "user_other" })).toThrow();
    expect(() => userPreferencesPatchSchema.parse({ updated_at: new Date().toISOString() })).toThrow();
    expect(() => userPreferencesPatchSchema.parse({ onboarding_version: 1 })).toThrow();
    expect(() => userPreferencesPatchSchema.parse({ onboarding_revision: 1 })).toThrow();
    expect(() => userPreferencesPatchSchema.parse({ onboarding_step: 1 })).toThrow();
    expect(() => userPreferencesPatchSchema.parse({ onboarding_draft: {} })).toThrow();
  });

  it("rejects empty patches and invalid bounded state", () => {
    expect(() => userPreferencesPatchSchema.parse({})).toThrow();
    expect(() => userPreferencesPatchSchema.parse({ theme: "midnight" })).toThrow();
    expect(() => userPreferencesPatchSchema.parse({ tour_status: "paused" })).toThrow();
  });

  it("validates complete persisted rows", () => {
    const updatedAt = "2026-08-23T12:00:00+00:00";
    expect(userPreferencesRowSchema.parse({
      user_id: "user_123",
      theme: "system",
      sidebar_collapsed: false,
      analytics_enabled: true,
      onboarding_version: 0,
      onboarding_revision: 0,
      onboarding_step: 0,
      onboarding_draft: {},
      tour_version: 0,
      tour_status: "not_started",
      tour_step: 0,
      tour_updated_at: null,
      updated_at: updatedAt,
    }).updated_at).toBe(updatedAt);
  });
});
