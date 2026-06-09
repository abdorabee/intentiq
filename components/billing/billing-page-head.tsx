"use client";

import { formatRenewDate } from "@/lib/billing-stats";
import IntentIQLogo from "@/components/intentiq-logo";

interface BillingPageHeadProps {
  renewAt: string | null;
  workspaceLabel: string;
  onTopUp: () => void;
}

export function BillingPageHead({ renewAt, workspaceLabel, onTopUp }: BillingPageHeadProps) {
  const renewDate = formatRenewDate(renewAt);

  return (
    <div className="bill-head">
      <div>
        <div className="title-row">
          <div className="title">Billing &amp; credits</div>
          <span className="ws-pill">
            <IntentIQLogo className="lg" size={16} />
            {workspaceLabel} · USD
          </span>
        </div>
        <div className="sub">
          Manage your plan, top-ups, payment methods, and invoices ·{" "}
          <span className="mono">
            {renewDate ? (
              <>
                Next charge{" "}
                <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>{renewDate}</strong>
              </>
            ) : (
              "Free tier · no upcoming charge"
            )}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" className="tb-btn outlined">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
            <path d="M3 7l3 3 3-3M6 1v9M2 11h8" />
          </svg>
          Download statement
        </button>
        <button type="button" className="btn-primary" onClick={onTopUp}>
          <svg className="ic" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2v8M2 6h8" />
          </svg>
          Top up credits
        </button>
      </div>
    </div>
  );
}
