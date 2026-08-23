import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { getOnboardingCompletionState, getOnboardingRedirect } from "@/lib/onboarding-completion";
import {
  ONBOARDING_VERSION,
  onboardingProgressRequestSchema,
} from "@/lib/onboarding-progress";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { BusinessProfile } from "@/lib/types";
import { getOrCreateUserPreferences } from "@/lib/user-preferences-server";
import { ensureUserRecord } from "@/lib/user-provisioning";

export const metadata: Metadata = {
  title: "Set Up Your Profile",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await ensureUserRecord(userId);

  const admin = createSupabaseAdmin();
  const [profileResult, preferences, scoreResult, watchlistResult] = await Promise.all([
    admin
      .from("users")
      .select("id,business_profile,onboarding_completed,onboarding_completed_at,onboarding_completed_version")
      .eq("id", userId)
      .single(),
    getOrCreateUserPreferences(userId),
    admin
      .from("scores")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("watchlist")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true),
  ]);
  if (profileResult.error || !profileResult.data || profileResult.data.id !== userId) {
    throw new Error("Onboarding profile is unavailable");
  }
  const profile = profileResult.data;
  if (
    typeof profile.onboarding_completed !== "boolean" ||
    (profile.onboarding_completed_at !== null && typeof profile.onboarding_completed_at !== "string") ||
    typeof profile.onboarding_completed_version !== "number"
  ) {
    throw new Error("Onboarding profile is unavailable");
  }
  const completionState = getOnboardingCompletionState({
    onboarding_completed: profile.onboarding_completed,
    onboarding_completed_at: profile.onboarding_completed_at,
    onboarding_completed_version: profile.onboarding_completed_version,
  });
  if (completionState === "invalid") throw new Error("Onboarding profile is unavailable");
  const onboardingRedirect = getOnboardingRedirect({
    onboarding_completed: profile.onboarding_completed,
    onboarding_completed_at: profile.onboarding_completed_at,
    onboarding_completed_version: profile.onboarding_completed_version,
  }, "onboarding");
  if (onboardingRedirect) redirect(onboardingRedirect);
  if (!preferences) throw new Error("Onboarding progress is unavailable");
  if (scoreResult.error || watchlistResult.error) {
    throw new Error("Onboarding activation evidence is unavailable");
  }

  const storedProfile =
    profile?.business_profile && typeof profile.business_profile === "object"
      ? profile.business_profile as Partial<BusinessProfile>
      : null;
  const parsedProgress = preferences?.onboarding_version === ONBOARDING_VERSION
    ? onboardingProgressRequestSchema.safeParse({
        step: preferences.onboarding_step,
        draft: preferences.onboarding_draft,
        revision: Math.max(1, preferences.onboarding_revision),
      })
    : null;
  const initialProfile = parsedProgress?.success
    ? parsedProgress.data.draft
    : storedProfile;
  const initialStep = parsedProgress?.success ? parsedProgress.data.step : 0;
  const initialActivation =
    ((scoreResult.count ?? 0) > 0 || (watchlistResult.count ?? 0) > 0);

  return (
    <OnboardingWizard
      initialProfile={initialProfile}
      initialStep={initialStep}
      initialActivation={initialActivation}
      initialRevision={preferences.onboarding_revision}
    />
  );
}
