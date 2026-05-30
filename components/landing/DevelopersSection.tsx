const INTEGRATIONS = ["Slack", "HubSpot", "Salesforce", "Gmail", "Outreach", "Apollo", "Zapier", "Webhook"];

export default function DevelopersSection() {
  return (
    <section id="api" className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="inline-flex items-center gap-2 text-[13px] text-[#8a8f98]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ec9d8]" />
          Developers + People
        </p>
        <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.03em] text-[#f7f8f8] md:text-4xl md:leading-tight">
          Built for sales ops
          <br />
          that actually ship.
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#8a8f98]">
          One REST endpoint. Bulk CSV. People scoring. Watchlists. Webhooks for the systems your team already lives in.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0b0d]">
            <div className="border-b border-white/[0.06] p-5">
              <h3 className="text-lg font-semibold text-[#f7f8f8]">One API call. Any company.</h3>
              <p className="mt-2 text-[14px] text-[#8a8f98]">
                POST a domain. Get a 0–100 score, five signals, and an AI summary in under three seconds.
              </p>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[11px] leading-relaxed text-[#8a8f98]">
              <span className="text-[#62666d]">{"// 200 OK · 1,420 ms\n"}</span>
              {"{\n  \"domain\": \"stripe.com\",\n  \"score\": 94,\n  \"band\": \"HOT\",\n  \"action\": \"Reference Series H...\"\n}"}
            </pre>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0b0d]">
            <div className="border-b border-white/[0.06] p-5">
              <h3 className="text-lg font-semibold text-[#f7f8f8]">Score the human, not just the logo.</h3>
              <p className="mt-2 text-[14px] text-[#8a8f98]">
                Email or LinkedIn. Career trajectory, seniority fit, and company intent — in one row.
              </p>
            </div>
            <div className="divide-y divide-white/[0.06] p-3">
              {[
                { name: "Elif Marwa", role: "VP Revenue Ops · Stripe", score: 88, band: "HOT" },
                { name: "Jamal Norris", role: "Head of GTM Systems · Linear", score: 81, band: "HOT" },
                { name: "Priya Tan", role: "Director, RevOps · Notion", score: 72, band: "WARM" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-3 px-2 py-2.5 text-[12px]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#5e6ad2]/25 text-[10px] font-bold text-[#f7f8f8]">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#f7f8f8]">{p.name}</p>
                    <p className="truncate text-[#62666d]">{p.role}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      p.band === "HOT" ? "text-[#4ade80] bg-[rgba(74,222,128,0.12)]" : "text-[#f5b544] bg-[rgba(245,181,68,0.12)]"
                    }`}
                  >
                    {p.band}
                  </span>
                  <span className="font-mono tabular-nums text-[#f7f8f8]">{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-[#0a0b0d] p-5">
            <h3 className="text-lg font-semibold text-[#f7f8f8]">Watchlist that pings you, not the other way around.</h3>
            <p className="mt-2 text-[14px] text-[#8a8f98]">
              Pin the accounts that matter. Get notified the moment one crosses your band threshold.
            </p>
            <div className="mt-4 space-y-2 text-[12px]">
              {["Anthropic ▲ now", "Stripe · 3m", "Linear · 9m"].map((row) => (
                <div key={row} className="flex justify-between rounded-md border border-white/[0.06] bg-[#131517] px-3 py-2 text-[#b4bbc8]">
                  {row}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0a0b0d] p-5">
            <h3 className="text-lg font-semibold text-[#f7f8f8]">Lives where your team lives.</h3>
            <p className="mt-2 text-[14px] text-[#8a8f98]">
              Webhooks, Slack, HubSpot, Salesforce, Gmail, Outreach, Apollo. Score events flow out; pipeline updates flow
              back in.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {INTEGRATIONS.map((name) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1 rounded-md border border-white/[0.06] bg-[#131517] px-2 py-3 text-[10px] text-[#8a8f98]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-white/[0.08] text-[9px] font-bold text-[#f7f8f8]">
                    {name.slice(0, 2)}
                  </div>
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
