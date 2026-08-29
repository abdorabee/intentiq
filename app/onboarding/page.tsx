import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import { getOnboardingRedirect } from "@/lib/onboarding-profile";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { BusinessProfile } from "@/lib/types";
import { ensureUserRecord } from "@/lib/user-provisioning";

export const metadata: Metadata = {
  title: "Set Up Your Profile",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const isPreview = process.env.VERCEL_ENV !== "production";
  
  if (isPreview) {
    return <OnboardingWizard initialProfile={null} />;
  }

  const { userId } = await auth();
  if (!userId) redirect("/login");

  await ensureUserRecord(userId);

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("users")
    .select("business_profile, onboarding_completed")
    .eq("id", userId)
    .single();

  const onboardingRedirect = getOnboardingRedirect(
    profile?.onboarding_completed ?? false,
    "onboarding"
  );
  if (onboardingRedirect) redirect(onboardingRedirect);

  const initialProfile =
    profile?.business_profile && typeof profile.business_profile === "object"
      ? profile.business_profile as Partial<BusinessProfile>
      : null;

  return <OnboardingWizard initialProfile={initialProfile} />;
}
