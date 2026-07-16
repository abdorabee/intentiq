import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase";
import DashboardShell from "@/components/dashboard/dashboard-shell";
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

  // Upsert first — guarantees the row exists before we select it. Existing
  // users are left untouched, while new users must complete onboarding.
  await admin.from("users").upsert(
    {
      id: userId,
      email: user?.emailAddresses[0]?.emailAddress ?? "",
      plan: "free",
      credits_remaining: 20,
      onboarding_completed: false,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { data: profile } = await admin
    .from("users")
    .select("credits_remaining, onboarding_completed, plan")
    .eq("id", userId)
    .single();

  const creditsRemaining = profile?.credits_remaining ?? 0;
  const onboardingCompleted = profile?.onboarding_completed ?? false;
  const plan = (profile?.plan as "free" | "starter" | "growth" | "pro" | "agency" | undefined) ?? "free";

  const { count: inboxCount } = await admin
    .from("inbox_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .eq("is_archived", false);

  const [{ count: watchlistCount }, { count: pipelineHotCount }] = await Promise.all([
    admin
      .from("watchlist")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true),
    admin
      .from("watchlist")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("score_band", "HOT"),
  ]);

  return (
    <OnboardingGate completed={onboardingCompleted}>
      {onboardingCompleted ? (
        <>
          <DashboardShell
            creditsRemaining={creditsRemaining}
            plan={plan}
            inboxCount={inboxCount ?? 0}
            watchlistCount={watchlistCount ?? 0}
            pipelineHotCount={pipelineHotCount ?? 0}
          >
            {children}
          </DashboardShell>
        </>
      ) : (
        <div className="relative min-h-screen bg-background font-sans">
          {children}
        </div>
      )}
    </OnboardingGate>
  );
}
