import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { SettingsView } from "./settings-view";

type SettingsTab = "profile" | "api-keys" | "notifications" | "billing";
const VALID_TABS: SettingsTab[] = ["profile", "api-keys", "notifications", "billing"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { tab } = await searchParams;
  const defaultTab: SettingsTab = VALID_TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : "profile";

  const admin = createSupabaseAdmin();
  const [{ data: userRow }, clerkUser] = await Promise.all([
    admin
      .from("users")
      .select(
        "email, plan, credits_remaining, subscription_renews_at, subscription_cancel_at_period_end, polar_subscription_id, created_at"
      )
      .eq("id", userId)
      .single(),
    currentUser().catch(() => null),
  ]);

  const identity = {
    name: clerkUser?.fullName || clerkUser?.firstName || "",
    email: userRow?.email ?? clerkUser?.emailAddresses[0]?.emailAddress ?? "",
    plan: (userRow?.plan ?? "free") as "free" | "starter" | "growth" | "pro" | "agency",
    memberSince: userRow?.created_at
      ? new Date(userRow.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : null,
  };

  const billing = {
    plan: identity.plan,
    creditsRemaining: userRow?.credits_remaining ?? 0,
    renewsAt: userRow?.subscription_renews_at ?? null,
    cancelAtPeriodEnd: userRow?.subscription_cancel_at_period_end ?? false,
    hasPolarSubscription: !!userRow?.polar_subscription_id,
  };

  return <SettingsView defaultTab={defaultTab} identity={identity} billing={billing} />;
}
