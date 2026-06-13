import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionLabel from "./SectionLabel";

const PREVIEW_ROWS = [
  { domain: "stripe.com", signal: "Series H · $6.5B", score: 94, band: "HOT", hot: true },
  { domain: "linear.app", signal: "+18 Eng. hires", score: 82, band: "HOT", hot: true },
  { domain: "anthropic.com", signal: "Press + funding", score: 96, band: "HOT", hot: true },
  { domain: "vercel.com", signal: "Segment + Snowflake", score: 67, band: "WARM", hot: false },
  { domain: "notion.so", signal: "Pricing traffic +96%", score: 78, band: "HOT", hot: true },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] px-5 pb-20 pt-12 md:px-8 md:pb-28 md:pt-16">
      <div className="landing-hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-hero-radial pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[#08090a]/40" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto flex max-w-[52rem] flex-col items-center text-center">
          <SectionLabel text="B2B sales intelligence" className="mb-4" />
          <h1 className="max-w-[20ch] text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[#f7f8f8] sm:max-w-none sm:text-4xl md:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
            Pipeline <span className="text-gradient">intelligence</span> for B2B sales teams.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#8a8f98] md:text-[17px]">
            VesperWise scores every account in your pipeline on a 0–100 buying-intent scale — live signals, AI reasoning,
            and the next move, in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#8b87ff] via-[#5e6ad2] to-[#4e5acb] px-6 py-3 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_36px_rgba(94,106,210,0.42)] hover:brightness-110"
            >
              Start scoring free
              <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
            </Link>
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-full border border-white/[0.18] px-6 py-3 text-[15px] font-medium text-[#e8eaed] hover:border-white/[0.28] hover:bg-white/[0.05]"
            >
              Book a demo
            </a>
          </div>
          <p className="mt-6 text-[13px] text-[#62666d]">
            <span className="text-[#8a8f98]">20 free credits</span>
            <span className="mx-2 text-[#3d4249]">•</span>
            <span className="text-[#8a8f98]">No credit card</span>
            <span className="mx-2 text-[#3d4249]">•</span>
            <span className="text-[#8a8f98]">Results in &lt; 3 seconds</span>
          </p>
        </div>

        <div className="relative mx-auto mt-14 w-full max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0b0d] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <div className="flex min-h-[280px] md:min-h-[320px]">
              <aside className="w-[76px] shrink-0 border-r border-white/[0.06] bg-[#08090a] p-2">
                <div className="rounded-md bg-white/[0.08] px-2 py-2 text-center text-[10px] font-semibold text-[#f7f8f8]">
                  Intent Hub
                </div>
                <p className="mt-2 px-1.5 py-1.5 text-[10px] text-[#62666d]">Accounts</p>
                <p className="px-1.5 py-1.5 text-[10px] text-[#62666d]">Lists</p>
              </aside>
              <div className="min-w-0 flex-1 p-3 md:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                  <p className="text-[11px] text-[#62666d]">
                    <span className="text-[#8a8f98]">Home</span>
                    <span className="mx-1.5 text-[#3d4249]">/</span>
                    <span className="text-[#b4bbc8]">Intent Hub</span>
                  </p>
                  <div className="flex gap-1.5">
                    <span className="rounded-full bg-[rgba(74,222,128,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#4ade80]">
                      HOT
                    </span>
                    <span className="rounded-full bg-[rgba(245,181,68,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#f5b544]">
                      WARM
                    </span>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-md border border-white/[0.06] bg-[#131517] px-2 py-1 text-[10px] text-[#8a8f98]">
                    Filter: Industry
                  </span>
                  <span className="rounded-md border border-white/[0.06] bg-[#131517] px-2 py-1 text-[10px] text-[#8a8f98]">
                    Score ≥ 50
                  </span>
                </div>
                <div className="grid grid-cols-[1.1fr_1fr_0.55fr_0.5fr] gap-2 border-b border-white/[0.06] pb-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#62666d]">
                  <span>Account</span>
                  <span>Signal</span>
                  <span className="text-right">Score</span>
                  <span className="text-right">Band</span>
                </div>
                <div className="mt-2 space-y-2 font-mono text-[11px]">
                  {PREVIEW_ROWS.map((row) => (
                    <div key={row.domain} className="grid grid-cols-[1.1fr_1fr_0.55fr_0.5fr] gap-2">
                      <span className="truncate text-[#f7f8f8]">{row.domain}</span>
                      <span className="truncate text-[#8a8f98]">{row.signal}</span>
                      <span className={`text-right tabular-nums ${row.hot ? "text-[#4ade80]" : "text-[#f5b544]"}`}>
                        {row.score}
                      </span>
                      <span className={`text-right ${row.hot ? "text-[#4ade80]" : "text-[#f5b544]"}`}>{row.band}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-white/[0.06] bg-[#131517] p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-[#62666d]">Recommended action</p>
                  <p className="mt-1 text-[11px] text-[#c9c4ff]">
                    Reach out this week — Series H + RevOps hiring signals align.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
