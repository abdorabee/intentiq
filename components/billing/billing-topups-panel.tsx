import { BILLING_TOPUPS, planYourTopupRate, topupUnitRate, type PlanKey } from "@/lib/billing-plans";

interface BillingTopupsPanelProps {
  plan: PlanKey;
  sectionId?: string;
}

export function BillingTopupsPanel({ plan, sectionId = "topups" }: BillingTopupsPanelProps) {
  const baseRate = BILLING_TOPUPS[0].price / BILLING_TOPUPS[0].credits;
  const yourRate = planYourTopupRate(plan);

  return (
    <div className="panel" id={sectionId}>
      <div className="panel-head">
        <div>
          <div className="t">Top up credits</div>
          <div className="s">One-time purchases. Credits never expire while plan is active.</div>
        </div>
        <div className="right">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.02em" }}>
            YOUR RATE · {yourRate}
          </span>
        </div>
      </div>
      <div className="topup-grid">
        {BILLING_TOPUPS.map((t) => {
          const rate = t.price / t.credits;
          const savePct =
            rate < baseRate ? Math.round((1 - rate / baseRate) * 100) : 0;
          return (
            <div key={t.amount} className={`topup-card${t.bestValue ? " best" : ""}`}>
              <div className="tu-credits">
                {t.credits.toLocaleString()}
                <span className="unit">credits</span>
              </div>
              <div className="tu-price">${t.price.toFixed(2)}</div>
              <div className="tu-rate">
                {topupUnitRate(t.price, t.credits)}
                {savePct > 0 && (
                  <>
                    {" · "}
                    <span className="save">save {savePct}%</span>
                  </>
                )}
              </div>
              <form action="/api/billing/topup" method="POST">
                <input type="hidden" name="amount" value={t.amount} />
                <button type="submit" className="tu-cta">
                  Add to plan
                </button>
              </form>
            </div>
          );
        })}
      </div>
      <div className="topup-foot">
        <svg className="ic" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="5.5" />
          <path d="M7 4v3.2l2 1.4" />
        </svg>
        Charges immediately. Credits added within seconds — no proration on monthly renewal.
      </div>
    </div>
  );
}
