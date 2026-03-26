"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface OnboardingGateProps {
  completed: boolean;
  children: React.ReactNode;
}

export default function OnboardingGate({ completed, children }: OnboardingGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingPage = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!completed && !isOnboardingPage) {
      router.replace("/onboarding");
    }
    if (completed && isOnboardingPage) {
      router.replace("/dashboard");
    }
  }, [completed, isOnboardingPage, router]);

  // While redirecting, render nothing to avoid flash
  if (!completed && !isOnboardingPage) return null;
  if (completed && isOnboardingPage) return null;

  return <>{children}</>;
}
