import type { BillingStats } from "@/lib/billing-stats";

interface BillingPaymentDetailsProps {
  stats: BillingStats;
  email: string;
  workspaceLabel: string;
}

export function BillingPaymentDetails({ stats, email, workspaceLabel }: BillingPaymentDetailsProps) {
  const hasCustomer = !!stats.profile.polar_customer_id;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <div className="t">Payment &amp; billing details</div>
          <div className="s">Charged in USD · via Polar.sh</div>
        </div>
        <div className="right">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-tertiary)",
              letterSpacing: "0.04em",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="10" height="10">
              <rect x="3" y="6" width="6" height="5" />
              <path d="M5 6V4a1.8 1.8 0 013.6 0v2" />
            </svg>
            PCI-COMPLIANT
          </span>
        </div>
      </div>
      <div className="pm-list">
        {hasCustomer ? (
          <div className="pm-row default">
            <div className="pm-card visa">VISA</div>
            <div className="pm-info">
              <div className="l1">
                Payment method on file
                <span className="tag">DEFAULT</span>
              </div>
              <div className="l2">Manage card &amp; billing details in Polar portal</div>
            </div>
            <a href="/api/billing/portal" className="pm-edit">
              Edit
            </a>
          </div>
        ) : null}
        {hasCustomer ? (
          <a href="/api/billing/portal" className="pm-add">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
              <path d="M6 2v8M2 6h8" />
            </svg>
            Add payment method
          </a>
        ) : (
          <a href="#plans" className="pm-add">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
              <path d="M6 2v8M2 6h8" />
            </svg>
            Add payment method
          </a>
        )}
      </div>
      <div className="billto">
        <div className="it">
          <div className="l">BILL TO</div>
          <div className="v">{workspaceLabel}</div>
        </div>
        <div className="it">
          <div className="l">BILLING EMAIL</div>
          <div className="v mono">{email || "—"}</div>
        </div>
        <div className="it full">
          <div className="l">ADDRESS</div>
          <div className="v" style={{ color: "var(--text-tertiary)" }}>
            Managed in Polar billing portal
          </div>
        </div>
        <div className="it">
          <div className="l">TAX ID</div>
          <div className="v mono" style={{ color: "var(--text-tertiary)" }}>
            —
          </div>
        </div>
        <div className="it">
          <div className="l">PO NUMBER</div>
          <div className="v" style={{ color: "var(--text-tertiary)" }}>
            — add for invoicing
          </div>
        </div>
      </div>
    </div>
  );
}
