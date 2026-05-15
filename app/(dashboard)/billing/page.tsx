import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PLAN_CREDITS } from "@/lib/types";
import { Check, Zap, Settings, AlertTriangle } from "lucide-react";
import { BillingNotification } from "./billing-notification";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";

// ─── Plan config ──────────────────────────────────────────────────────────────

type PlanDef = {
  key: string;
  label: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
};

const PLANS: PlanDef[] = [
  {
    key: "starter",
    label: "Starter",
    price: 29,
    credits: 500,
    features: ["500 intent scores/mo", "50 watchlist companies", "CSV exports", "API access"],
  },
  {
    key: "growth",
    label: "Growth",
    price: 79,
    credits: 2500,
    features: ["2,500 intent scores/mo", "250 watchlist companies", "Bulk scorer", "5 Autopilot workflows"],
    popular: true,
  },
  {
    key: "pro",
    label: "Pro",
    price: 199,
    credits: 8000,
    features: ["8,000 intent scores/mo", "1,000 watchlist companies", "People scorer", "50 Autopilot workflows"],
  },
  {
    key: "agency",
    label: "Agency",
    price: 499,
    credits: 25000,
    features: ["25,000 intent scores/mo", "Unlimited watchlist", "Priority support", "Unlimited Autopilot"],
  },
];

const TOPUPS = [
  { amount: "100", credits: 100, price: 9 },
  { amount: "500", credits: 500, price: 39 },
  { amount: "1000", credits: 1000, price: 69 },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BillingPage() {
  const { userId } = await auth();
  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("users")
    .select("plan, credits_remaining, polar_subscription_id, subscription_renews_at, subscription_cancel_at_period_end")
    .eq("id", userId!)
    .single();

  const plan = profile?.plan ?? "free";
  const creditsRemaining = profile?.credits_remaining ?? 0;
  const totalCredits = PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS] ?? 20;
  const usedCredits = Math.max(0, totalCredits - creditsRemaining);
  const isPaid = plan !== "free" && !!profile?.polar_subscription_id;
  const cancelScheduled = profile?.subscription_cancel_at_period_end ?? false;

  const renewsAt = profile?.subscription_renews_at
    ? new Date(profile.subscription_renews_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <DashboardPageShell
      eyebrow="Billing"
      title="Plans & credits"
      description="Manage your subscription and credits."
      maxWidthClass="max-w-4xl"
    >
      <BillingNotification />
      {/* Current Plan */}
      <Card className="border-slate-200 dark:border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-100">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan + credits remaining */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Badge className="capitalize text-base px-3 py-1 bg-[#5e6ad2]/20 text-[#c9c4ff] border border-[#5e6ad2]/35">
                {plan}
              </Badge>
              <span className="text-slate-500 dark:text-slate-400">{totalCredits} credits/month</span>
            </div>
            {/* Credits remaining — matches sidebar */}
            <div className="text-right">
              <span className={`text-xl font-bold ${creditsRemaining < 5 ? "text-amber-400" : "text-slate-800 dark:text-slate-100"}`}>
                {creditsRemaining}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-sm ml-1">remaining</span>
            </div>
          </div>

          {/* Credits progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 text-slate-500 dark:text-slate-400">
              <span>{usedCredits} used</span>
              <span>{totalCredits} total</span>
            </div>
            <Progress value={(usedCredits / totalCredits) * 100} className="bg-slate-100 dark:bg-white/[0.06]" />
          </div>

          {/* Renewal / cancellation status */}
          {renewsAt && (
            <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
              cancelScheduled
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                : "bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400"
            }`}>
              {cancelScheduled && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
              <span>
                {cancelScheduled
                  ? `Subscription cancels on ${renewsAt}. You keep access until then.`
                  : `Renews on ${renewsAt}`}
              </span>
            </div>
          )}

          {/* Subscription actions — shown for paid users */}
          {isPaid && (
            <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
              <a
                href="/api/billing/portal"
                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Manage Subscription
              </a>
              <a
                href="/api/billing/portal"
                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                Cancel Plan
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Upgrade Your Plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => {
            const isCurrent = plan === p.key;
            return (
              <div
                key={p.key}
                className={`relative rounded-xl border p-5 flex flex-col gap-4 ${
                  p.popular
                    ? "border-[#5e6ad2]/50 bg-[#5e6ad2]/5 dark:bg-[#5e6ad2]/[0.07]"
                    : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03]"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#5e6ad2] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">{p.label}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">${p.price}</span>
                    <span className="text-slate-400 text-sm pb-0.5">/mo</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {p.credits.toLocaleString()} credits/month
                  </div>
                </div>

                <ul className="space-y-1.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="w-3.5 h-3.5 text-[#7170ff] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full rounded-lg border border-[#5e6ad2]/35 bg-[#5e6ad2]/10 py-2 text-center text-xs font-medium text-[#c9c4ff]">
                    Current Plan
                  </div>
                ) : (
                  <form action="/api/billing/checkout" method="POST">
                    <input type="hidden" name="plan" value={p.key} />
                    <button
                      type="submit"
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                        p.popular
                          ? "bg-[#5e6ad2] hover:bg-[#7170ff] text-white"
                          : "bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      Upgrade to {p.label}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit Top-Ups */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Credit Top-Ups</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Need more credits? Purchase one-time packs — they stack on top of your monthly allowance.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TOPUPS.map((t) => (
            <div
              key={t.amount}
              className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/25 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#7170ff]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {t.credits.toLocaleString()} Credits
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">${t.price} one-time</div>
                </div>
              </div>
              <form action="/api/billing/topup" method="POST">
                <input type="hidden" name="amount" value={t.amount} />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Buy {t.credits.toLocaleString()} Credits
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </DashboardPageShell>
  );
}
