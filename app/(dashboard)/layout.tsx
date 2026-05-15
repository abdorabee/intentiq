import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import ChatTrigger from "@/components/chat/chat-trigger";
import OnboardingGate from "@/components/onboarding-gate";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  // Provision user row in Supabase on first login (no-op if already exists)
  let user;
  try {
    user = await currentUser();
  } catch {
    // Clerk API may be unreachable or keys misconfigured — continue with null user
    user = null;
  }

  const admin = createSupabaseAdmin();

  // Upsert first — guarantees the row exists before we select it.
  // Running both concurrently via Promise.all caused a race where the select
  // returned null for brand-new users, setting onboardingCompleted=false and
  // triggering an infinite redirect loop to the non-existent /onboarding page.
  await admin.from("users").upsert(
    {
      id: userId,
      email: user?.emailAddresses[0]?.emailAddress ?? "",
      plan: "free",
      credits_remaining: 20,
      onboarding_completed: true,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { data: profile } = await admin
    .from("users")
    .select("credits_remaining, onboarding_completed, plan")
    .eq("id", userId)
    .single();

  const creditsRemaining = profile?.credits_remaining ?? 0;
  const onboardingCompleted = profile?.onboarding_completed ?? true;
  const plan = (profile?.plan as "free" | "starter" | "growth" | "pro" | "agency" | undefined) ?? "free";

  return (
    <OnboardingGate completed={onboardingCompleted}>
      {onboardingCompleted ? (
        <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden font-sans text-[13px] tracking-[-0.006em] antialiased">
          <div className="relative flex min-h-screen">
            <DashboardShell creditsRemaining={creditsRemaining} plan={plan}>
              {children}
            </DashboardShell>
          </div>
          <ChatTrigger creditsRemaining={creditsRemaining} />
        </div>
      ) : (
        // During onboarding: clean layout without sidebar/nav
        <div className="relative min-h-screen bg-background font-sans">
          {children}
        </div>
      )}
    </OnboardingGate>
  );
}
