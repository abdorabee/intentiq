function SectionAccentLabel({ children }: { children: string }) {
  return (
    <p className="inline-flex items-center gap-2 text-[13px] text-[#8a8f98]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#dfff00]" />
      {children}
    </p>
  );
}

const SIGNALS = [
  { name: "Funding", desc: "Series H, $6.5B at $91.5B valuation · 4 days ago", score: 96, weight: "22", bar: "from-[#dfff00] to-[#38a3b3]" },
  { name: "Hiring", desc: "+182 open roles in Eng / RevOps · +28 vs last 30 days", score: 88, weight: "19", bar: "from-[#4ade80] to-[#22c55e]" },
  { name: "News", desc: "12 non-funding trigger stories in 7 days", score: 92, weight: "18", bar: "from-[#f5b544] to-[#d49530]" },
  { name: "Tech", desc: "Dated stack change: Segment adopted this month", score: 78, weight: "18", bar: "from-[#e8ff40] to-[#dfff00]" },
];

export default function ScoreFeatureSection() {
  return (
    <section id="score-section" className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionAccentLabel>The Score</SectionAccentLabel>
        <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.03em] text-[#f7f8f8] md:text-4xl md:leading-tight">
          A 0–100 number
          <br />
          your AE doesn&apos;t have to interpret.
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#8a8f98]">
          One score per account, per refresh. Click in for the signals that produced it, an AI summary, and the play to
          run next.
        </p>

        <div className="relative mt-12 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0b0d] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="grid lg:grid-cols-[1fr_320px]">
            <div className="border-b border-white/[0.06] p-4 md:p-5 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
                <span className="font-mono text-[11px] text-[#62666d]">IQ-2046</span>
                <span className="rounded-full bg-[rgba(74,222,128,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#4ade80]">
                  HOT · Auto-routed
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dfff00]/30 text-sm font-bold text-[#f7f8f8]">
                  S
                </div>
                <div>
                  <p className="font-semibold text-[#f7f8f8]">Stripe</p>
                  <p className="text-[11px] text-[#62666d]">stripe.com · Payments · San Francisco</p>
                </div>
              </div>
              <div className="mt-4 flex gap-1 border-b border-white/[0.06] pb-2 text-[11px]">
                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[#f7f8f8]">Intent triggers 4</span>
                <span className="px-2 py-1 text-[#62666d]">Activity</span>
                <span className="px-2 py-1 text-[#62666d]">People 12</span>
              </div>
              <div className="mt-3 space-y-3">
                {SIGNALS.map((s) => (
                  <div key={s.name} className="grid grid-cols-[72px_1fr_32px_36px] items-center gap-2 text-[11px]">
                    <span className="text-[#b4bbc8]">{s.name}</span>
                    <div>
                      <p className="mb-1 text-[#8a8f98]">{s.desc}</p>
                      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${s.bar}`}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-right font-mono tabular-nums text-[#f7f8f8]">{s.score}</span>
                    <span className="text-right text-[#62666d]">{s.weight}</span>
                  </div>
                ))}
                <p className="border-t border-white/[0.06] pt-3 text-[10px] text-[#62666d]">
                  Relative weights shown at right. Web authority and GitHub activity are context only.
                </p>
              </div>
            </div>

            <div className="p-4 md:p-5">
              <div className="flex flex-col items-center">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#scoreGrad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="263.9"
                      strokeDashoffset="15.8"
                    />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="100" y2="100">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="55%" stopColor="#dfff00" />
                        <stop offset="100%" stopColor="#e8ff40" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute text-center">
                    <p className="font-mono text-3xl font-semibold text-[#4ade80]">94</p>
                    <p className="text-[10px] text-[#62666d]">/ 100</p>
                    <p className="mt-0.5 text-[10px] text-[#4ade80]">▲ 12 vs last week</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-[11px]">
                <div className="flex justify-between text-[#8a8f98]">
                  <span>Owner</span>
                  <span className="text-[#f7f8f8]">D. Marwan</span>
                </div>
                <div className="flex justify-between text-[#8a8f98]">
                  <span>Stage</span>
                  <span className="text-[#f7f8f8]">Discovery → Qualified</span>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-[#dfff00]/20 bg-[#dfff00]/5 p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#e8ff40]">AI summary</p>
                <p className="mt-2 text-[12px] leading-relaxed text-[#b4bbc8]">
                  Stripe has fresh capital, aggressive RevOps hiring, and a positive non-funding news cycle—three dated
                  triggers that can precede a tooling refresh.
                </p>
              </div>
              <div className="mt-3 rounded-lg border border-white/[0.06] bg-[#131517] p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#62666d]">Recommended next action</p>
                <p className="mt-1 text-[12px] text-[#dfff00]">
                  Send AE-authored email referencing Series H — anchor on RevOps tooling pain at scale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
