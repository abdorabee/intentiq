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
  const [, { data: profile }] = await Promise.all([
    admin.from("users").upsert(
      {
        id: userId,
        email: user?.emailAddresses[0]?.emailAddress ?? "",
        plan: "free",
        credits_remaining: 20,
      },
      { onConflict: "id", ignoreDuplicates: true }
    ),
    admin.from("users").select("credits_remaining, onboarding_completed").eq("id", userId).single(),
  ]);

  const creditsRemaining = profile?.credits_remaining ?? 0;
  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return (
    <OnboardingGate completed={onboardingCompleted}>
      {onboardingCompleted ? (
        <div className="relative min-h-screen bg-white dark:bg-black overflow-x-hidden" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
          {/* Subtle wireframe grid background */}
          <div className="fixed inset-0 pointer-events-none dark:block hidden" aria-hidden>
            <div className="absolute inset-0" style={{
              backgroundImage: "linear-gradient(rgba(6, 182, 212, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.04) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.08)_0%,transparent_50%)]" />
          </div>
          <div className="fixed inset-0 pointer-events-none dark:hidden block" aria-hidden>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.05)_0%,transparent_50%)]" />
          </div>

          <div className="relative flex min-h-screen">
            <DashboardShell creditsRemaining={creditsRemaining}>
              {children}
            </DashboardShell>
          </div>
          <ChatTrigger creditsRemaining={creditsRemaining} />
        </div>
      ) : (
        // During onboarding: clean layout without sidebar/nav
        <div className="relative min-h-screen bg-white dark:bg-black" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
          {children}
        </div>
      )}
    </OnboardingGate>
  );
}
