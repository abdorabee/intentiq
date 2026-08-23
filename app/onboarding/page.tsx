import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { getOnboardingRedirect } from "@/lib/onboarding-profile";
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
      .select("business_profile, onboarding_completed")
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
  const profile = profileResult.data;

  const onboardingRedirect = getOnboardingRedirect(
    profile?.onboarding_completed ?? false,
    "onboarding"
  );
  if (onboardingRedirect) redirect(onboardingRedirect);

  const storedProfile =
    profile?.business_profile && typeof profile.business_profile === "object"
      ? profile.business_profile as Partial<BusinessProfile>
      : null;
  const parsedProgress = preferences?.onboarding_version === ONBOARDING_VERSION
    ? onboardingProgressRequestSchema.safeParse({
        step: preferences.onboarding_step,
        draft: preferences.onboarding_draft,
      })
    : null;
  const initialProfile = parsedProgress?.success
    ? parsedProgress.data.draft
    : storedProfile;
  const initialStep = parsedProgress?.success ? parsedProgress.data.step : 0;
  const initialActivation =
    !scoreResult.error &&
    !watchlistResult.error &&
    ((scoreResult.count ?? 0) > 0 || (watchlistResult.count ?? 0) > 0);

  return (
    <OnboardingWizard
      initialProfile={initialProfile}
      initialStep={initialStep}
      initialActivation={initialActivation}
    />
  );
}
