import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/settings/settings-section";
import { getPlanDef } from "@/lib/billing-plans";
import { formatRenewDate, daysUntilReset } from "@/lib/billing-stats";
import type { DbUser } from "@/lib/types";

interface BillingTabProps {
  plan: DbUser["plan"];
  creditsRemaining: number;
  renewsAt: string | null;
  cancelAtPeriodEnd: boolean;
  hasPolarSubscription: boolean;
}

export function BillingTab({ plan, creditsRemaining, renewsAt, cancelAtPeriodEnd, hasPolarSubscription }: BillingTabProps) {
  const planDef = getPlanDef(plan);
  const creditPct = planDef.credits > 0 ? Math.min(100, Math.round((creditsRemaining / planDef.credits) * 100)) : 0;
  const renewLabel = formatRenewDate(renewsAt);
  const daysLeft = daysUntilReset(renewsAt);

  return (
    <SettingsSection
      title="Plan & billing"
      description="A quick look at your subscription — manage the full details on the Billing page."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-100 capitalize">{planDef.label}</span>
              {planDef.price > 0 && (
                <span className="text-sm text-slate-500">${planDef.price}/mo</span>
              )}
              {cancelAtPeriodEnd && <Badge variant="destructive">Cancels at period end</Badge>}
            </div>
            {renewLabel && (
              <p className="text-xs text-slate-500 mt-1">
                Renews {renewLabel}{daysLeft != null ? ` (${daysLeft}d)` : ""}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Credits</span>
            <span>{creditsRemaining.toLocaleString()} / {planDef.credits.toLocaleString()}</span>
          </div>
          <Progress value={creditPct} />
        </div>

        <ul className="space-y-1.5">
          {planDef.heroFeatures.map((feature) => (
            <li key={feature} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-cyan-500 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 pt-2">
          <Link href="/billing" className="btn-primary">
            Open billing
          </Link>
          {hasPolarSubscription && (
            <a href="/api/billing/portal" className="text-xs text-cyan-500 hover:underline">
              Manage subscription
            </a>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}
