import { ONBOARDING_VERSION } from "@/lib/onboarding-progress";

export interface OnboardingCompletionTuple {
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_completed_version: number;
}

export type OnboardingCompletionState = "complete" | "incomplete" | "invalid";

export function getOnboardingCompletionState(
  value: OnboardingCompletionTuple,
): OnboardingCompletionState {
  if (
    value.onboarding_completed === false &&
    value.onboarding_completed_at === null &&
    value.onboarding_completed_version === 0
  ) {
    return "incomplete";
  }
  if (
    value.onboarding_completed === true &&
    typeof value.onboarding_completed_at === "string" &&
    value.onboarding_completed_at.length > 0 &&
    value.onboarding_completed_version >= ONBOARDING_VERSION
  ) {
    return "complete";
  }
  return "invalid";
}

export function getOnboardingRedirect(
  value: OnboardingCompletionTuple,
  destination: "dashboard" | "onboarding",
): "/dashboard" | "/onboarding" | null {
  const state = getOnboardingCompletionState(value);
  if (state === "invalid") throw new Error("Invalid onboarding completion tuple");
  if (destination === "dashboard" && state === "incomplete") return "/onboarding";
  if (destination === "onboarding" && state === "complete") return "/dashboard";
  return null;
}
