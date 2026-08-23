import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOnboardingRedirect } from "@/lib/onboarding-profile";
import { createSupabaseAdmin } from "@/lib/supabase";
import { ensureUserRecord } from "@/lib/user-provisioning";
import { getOrCreateUserPreferences } from "@/lib/user-preferences-server";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { GoogleAnalytics } from "@/components/google-analytics";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  await ensureUserRecord(userId);
  const preferences = await getOrCreateUserPreferences(userId);
  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("users")
    .select("credits_remaining, onboarding_completed, plan")
    .eq("id", userId)
    .single();

  const creditsRemaining = profile?.credits_remaining ?? 0;
  const onboardingCompleted = profile?.onboarding_completed ?? false;
  const plan = (profile?.plan as "free" | "starter" | "growth" | "pro" | "agency" | undefined) ?? "free";

  const onboardingRedirect = getOnboardingRedirect(onboardingCompleted, "dashboard");
  if (onboardingRedirect) redirect(onboardingRedirect);

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

  const preferenceBootstrap = preferences
    ? `(function(){try{var t=${JSON.stringify(preferences.theme)};var c=${String(preferences.sidebar_collapsed)};var d=document.documentElement;localStorage.setItem('intentiq-theme',t);localStorage.setItem('nav-collapsed',String(c));var dark=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);d.classList.toggle('dark',dark);d.dataset.dashboardSidebar=c?'collapsed':'expanded';}catch(e){}})();`
    : null;

  return (
    <>
      {preferenceBootstrap && (
        <script dangerouslySetInnerHTML={{ __html: preferenceBootstrap }} />
      )}
      <GoogleAnalytics initialEnabled={preferences?.analytics_enabled ?? false} />
      <DashboardShell
        creditsRemaining={creditsRemaining}
        plan={plan}
        inboxCount={inboxCount ?? 0}
        watchlistCount={watchlistCount ?? 0}
        pipelineHotCount={pipelineHotCount ?? 0}
        initialSidebarCollapsed={preferences?.sidebar_collapsed}
        initialTheme={preferences?.theme}
      >
        {children}
      </DashboardShell>
    </>
  );
}
