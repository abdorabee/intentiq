const COLS = [
  {
    name: "Cold",
    count: 14,
    color: "#62666d",
    cards: [
      { id: "IQ-2099", company: "Mixpanel", summary: "No new signals. Domain authority dropped 3 pts.", score: 38, band: "cold" },
    ],
  },
  {
    name: "Warming",
    count: 38,
    color: "#f5b544",
    cards: [
      { id: "IQ-2095", company: "Vercel", summary: "Detected Segment + Snowflake. Hiring up 12% MoM.", score: 67, band: "warm" },
      { id: "IQ-2094", company: "Figma", summary: "Config keynote pricing pivot. Press cycle ramping.", score: 71, band: "warm" },
    ],
  },
  {
    name: "Hot",
    count: 12,
    color: "#4ade80",
    cards: [
      { id: "IQ-2046", company: "Stripe", summary: "Series H · $6.5B. Auto-routed via Autopilot.", score: 94, band: "hot", highlight: true },
      { id: "IQ-2041", company: "Anthropic", summary: "Press + funding + hiring all 90+. Five axes lit.", score: 96, band: "hot", highlight: true },
    ],
  },
  {
    name: "Engaged",
    count: 6,
    color: "#dfff00",
    cards: [
      { id: "IQ-1998", company: "Databricks", summary: "Reply received. Discovery call set for Thu.", score: 87, band: "hot" },
    ],
  },
];

function bandClass(band: string) {
  if (band === "hot") return "text-[#4ade80] bg-[rgba(74,222,128,0.12)]";
  if (band === "warm") return "text-[#f5b544] bg-[rgba(245,181,68,0.12)]";
  return "text-[#62666d] bg-white/[0.06]";
}

export default function PipelineFeatureSection() {
  return (
    <section className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="inline-flex items-center gap-2 text-[13px] text-[#8a8f98]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#dfff00]" />
          Intent Hub
        </p>
        <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.03em] text-[#f7f8f8] md:text-4xl md:leading-tight">
          Your pipeline, ranked by
          <br />
          buying intent — not last-touch.
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#8a8f98]">
          Every account flows across stages by score. HOT bubbles up. COLD drops out. Owners see only what&apos;s worth a
          call this week.
        </p>

        <div className="mt-12 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0b0d]">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3 text-[11px]">
            <span className="rounded-md bg-white/[0.08] px-2 py-1 text-[#f7f8f8]">Board</span>
            <span className="px-2 py-1 text-[#62666d]">List</span>
            <span className="px-2 py-1 text-[#62666d]">Timeline</span>
            <span className="ml-auto rounded-md border border-white/[0.08] px-2 py-1 text-[#8a8f98]">Filter</span>
          </div>
          <div className="overflow-x-auto p-4">
            <div className="flex min-w-[720px] gap-3">
              {COLS.map((col) => (
                <div key={col.name} className="min-w-[168px] flex-1 rounded-lg bg-[#131517] p-2">
                  <div className="mb-2 flex items-center gap-2 px-1 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: col.color }} />
                    <span className="font-medium text-[#f7f8f8]">{col.name}</span>
                    <span className="text-[#62666d]">{col.count}</span>
                  </div>
                  <div className="space-y-2">
                    {col.cards.map((card) => (
                      <div
                        key={card.id}
                        className={`rounded-md border p-2.5 ${
                          "highlight" in card && card.highlight
                            ? "border-[rgba(74,222,128,0.2)] bg-gradient-to-b from-[rgba(74,222,128,0.03)] to-transparent"
                            : "border-white/[0.06] bg-[#0e1011]"
                        }`}
                      >
                        <p className="font-mono text-[9px] text-[#62666d]">{card.id}</p>
                        <p className="mt-1 text-[12px] font-semibold text-[#f7f8f8]">{card.company}</p>
                        <p className="mt-1 text-[10px] leading-snug text-[#8a8f98]">{card.summary}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold ${bandClass(card.band)}`}
                        >
                          {card.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
