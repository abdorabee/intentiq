import { describe, expect, it } from "vitest";

import { getOnboardingRedirect } from "./onboarding-completion";

const incomplete = {
  onboarding_completed: false,
  onboarding_completed_at: null,
  onboarding_completed_version: 0,
} as const;

const complete = {
  onboarding_completed: true,
  onboarding_completed_at: "2026-08-23T18:00:00.000Z",
  onboarding_completed_version: 1,
} as const;

describe("completion-tuple routing", () => {
  it("routes dashboard and onboarding only from a consistent tuple", () => {
    expect(getOnboardingRedirect(incomplete, "dashboard")).toBe("/onboarding");
    expect(getOnboardingRedirect(incomplete, "onboarding")).toBeNull();
    expect(getOnboardingRedirect(complete, "dashboard")).toBeNull();
    expect(getOnboardingRedirect(complete, "onboarding")).toBe("/dashboard");
  });

  it("fails closed for inconsistent tuples", () => {
    expect(() => getOnboardingRedirect({
      onboarding_completed: true,
      onboarding_completed_at: null,
      onboarding_completed_version: 1,
    }, "dashboard")).toThrow("Invalid onboarding completion tuple");
  });
});
