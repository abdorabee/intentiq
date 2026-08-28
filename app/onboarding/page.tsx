import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { getOnboardingRedirect, resolveOnboardingResume } from "@/lib/onboarding-profile";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { BusinessProfile } from "@/lib/types";
import { ensureUserRecord } from "@/lib/user-provisioning";
import type { OnboardingDraftPreference } from "@/lib/user-preferences";

export const metadata: Metadata = {
  title: "Set Up Your Profile",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await ensureUserRecord(userId);

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("users")
    .select("business_profile, onboarding_completed, preferences")
    .eq("id", userId)
    .single();

  const onboardingRedirect = getOnboardingRedirect(
    profile?.onboarding_completed ?? false,
    "onboarding"
  );
  if (onboardingRedirect) redirect(onboardingRedirect);

  const preferences =
    profile?.preferences && typeof profile.preferences === "object"
      ? profile.preferences as {
          onboarding_step?: unknown;
          onboarding_draft?: OnboardingDraftPreference | null;
        }
      : null;

  const storedProfile =
    profile?.business_profile && typeof profile.business_profile === "object"
      ? profile.business_profile as Partial<BusinessProfile>
      : null;

  const resume = resolveOnboardingResume({
    step: preferences?.onboarding_step,
    draft: preferences?.onboarding_draft ?? null,
    profile: storedProfile,
  });

  return (
    <OnboardingWizard
      initialProfile={resume.profile}
      initialStep={resume.step}
    />
  );
}
