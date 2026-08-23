import { describe, expect, it } from "vitest";

import {
  onboardingResetRedirect,
  parseProfilePatch,
  selectableRoles,
} from "./user-role";

describe("parseProfilePatch", () => {
  it("accepts an editable sales role", () => {
    const result = parseProfilePatch({ role: "ae" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ role: "ae" });
    }
  });

  it("accepts an onboarding reset and nothing else", () => {
    const result = parseProfilePatch({ onboarding_completed: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ onboarding_completed: false });
    }
  });

  it("rejects self-promotion to admin and completed-onboarding shortcuts", () => {
    expect(parseProfilePatch({ role: "admin" }).success).toBe(false);
    expect(parseProfilePatch({ onboarding_completed: true }).success).toBe(false);
    expect(parseProfilePatch({}).success).toBe(false);
    expect(parseProfilePatch({ business_profile: {} }).success).toBe(false);
  });
});

describe("selectableRoles", () => {
  it("offers SDR, AE, and Manager for ordinary users", () => {
    expect(selectableRoles("sdr")).toEqual(["sdr", "ae", "manager"]);
    expect(selectableRoles("ae")).toEqual(["sdr", "ae", "manager"]);
    expect(selectableRoles(null)).toEqual(["sdr", "ae", "manager"]);
  });

  it("keeps Admin visible when that role is already set", () => {
    expect(selectableRoles("admin")).toEqual(["sdr", "ae", "manager", "admin"]);
  });
});

describe("onboarding reset", () => {
  it("sends the user back to onboarding only after the flag is cleared", () => {
    expect(onboardingResetRedirect(false)).toBe("/onboarding");
    expect(onboardingResetRedirect(true)).toBeNull();
  });
});
