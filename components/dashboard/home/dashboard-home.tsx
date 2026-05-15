"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

function KpiCard({
  title,
  iconTint,
  children,
  meta,
  spark,
}: {
  title: string;
  iconTint: string;
  children: React.ReactNode;
  meta: string;
  spark: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#0e1011] px-[18px] py-4">
      <div className="mb-3.5 flex items-center gap-2 text-xs text-[#8a8f98] tracking-[-0.006em]">
        <span className={`grid h-3.5 w-3.5 place-items-center rounded ${iconTint}`} />
        <span>{title}</span>
        <span className="ml-auto grid h-[18px] w-[18px] cursor-pointer place-items-center rounded text-[#62666d] hover:bg-white/[0.06] hover:text-[#f7f8f8]">
          ⋯
        </span>
      </div>
      {children}
      <p className="mt-2.5 text-[11px] text-[#62666d] tracking-[-0.006em]">{meta}</p>
      <div className="mt-2 flex h-[22px] items-end gap-0.5">{spark}</div>
    </div>
  );
}

function SparkBar({ pct, hl }: { pct: number; hl?: "hot" | "warm" | "accent" }) {
  const bg =
    hl === "hot" ? "bg-[#4ade80]" : hl === "warm" ? "bg-[#f5b544]" : hl === "accent" ? "bg-[#7170ff]" : "bg-white/[0.08]";
  return <div className={cn("max-w-[6px] flex-1 rounded-[1px]", bg)} style={{ height: `${pct}%` }} />;
}

function CardShell({
  title,
  sub,
  actions,
  children,
  dense,
  foot,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  dense?: boolean;
  foot?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#0e1011]">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.08] px-[18px] py-3.5">
        <div className="min-w-0">
          <div className="text-[13px] font-medium tracking-[-0.011em] text-[#f7f8f8]">{title}</div>
          {sub && <div className="text-xs tracking-[-0.006em] text-[#8a8f98]">{sub}</div>}
        </div>
        {actions && <div className="ml-auto flex items-center gap-1.5">{actions}</div>}
      </div>
      <div className={dense ? "min-h-0 flex-1 overflow-auto" : "min-h-0 flex-1 p-[18px]"}>{children}</div>
      {foot}
    </div>
  );
}

export default function DashboardHomeView() {
  return (
    <div className="text-[13px] tracking-[-0.006em] text-[#f7f8f8]">
      <div className="border-b border-white/[0.04] px-7 pb-[18px] pt-5">
        <div className="flex flex-col gap-4 pb-[18px] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[22px] font-medium tracking-[-0.024em] text-[#f7f8f8]">Dashboard</h1>
            <p className="mt-1 text-[13px] text-[#8a8f98]">
              <span className="font-mono text-[#b4bbc8]">247</span> accounts tracked ·{" "}
              <span className="font-mono text-[#b4bbc8]">3 min</span> ago last refresh · next refresh in{" "}
              <span className="font-mono text-[#b4bbc8]">6h 12m</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.03] p-0.5">
              {["24H", "7D", "30D", "90D", "YTD"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={cn(
                    "rounded px-2.5 py-1 font-mono text-xs",
                    t === "7D" ? "bg-white/[0.07] text-[#f7f8f8]" : "text-[#8a8f98] hover:text-[#f7f8f8]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="rounded-md border border-white/[0.08] px-2.5 py-1 text-[13px] text-[#b4bbc8] hover:border-white/[0.13] hover:bg-white/[0.04]"
            >
              Refresh
            </button>
            <button
              type="button"
              className="rounded-md border border-white/[0.08] px-2.5 py-1 text-[13px] text-[#b4bbc8] hover:border-white/[0.13] hover:bg-white/[0.04]"
            >
              Add panel
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-7 pb-10 pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="HOT accounts"
            iconTint="bg-[rgba(74,222,128,0.1)] text-[#4ade80]"
            meta="vs 8 last week"
            spark={
              <>
                <SparkBar pct={30} />
                <SparkBar pct={42} />
                <SparkBar pct={38} />
                <SparkBar pct={51} />
                <SparkBar pct={48} />
                <SparkBar pct={70} hl="hot" />
                <SparkBar pct={90} hl="hot" />
              </>
            }
          >
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-medium tracking-[-0.035em] text-[#f7f8f8] tabular-nums">12</span>
              <span className="inline-flex items-center gap-0.5 font-mono text-xs text-[#4ade80]">▲ 4 (50%)</span>
            </div>
          </KpiCard>
          <KpiCard
            title="Avg HOT-band score"
            iconTint="bg-[rgba(78,201,216,0.16)] text-[#4ec9d8]"
            meta="range 78–96 across 12 accounts"
            spark={
              <>
                <SparkBar pct={60} />
                <SparkBar pct={64} />
                <SparkBar pct={62} />
                <SparkBar pct={71} />
                <SparkBar pct={74} />
                <SparkBar pct={82} hl="accent" />
                <SparkBar pct={88} hl="accent" />
              </>
            }
          >
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-medium tracking-[-0.035em] text-[#f7f8f8] tabular-nums">87.4</span>
              <span className="inline-flex items-center gap-0.5 font-mono text-xs text-[#4ade80]">▲ 2.1</span>
            </div>
          </KpiCard>
          <KpiCard
            title="Autopilot fires"
            iconTint="bg-[rgba(245,181,68,0.1)] text-[#f5b544]"
            meta="3 active workflows · 412 this month"
            spark={
              <>
                <SparkBar pct={40} />
                <SparkBar pct={55} />
                <SparkBar pct={48} />
                <SparkBar pct={62} hl="warm" />
                <SparkBar pct={71} hl="warm" />
                <SparkBar pct={78} hl="warm" />
                <SparkBar pct={88} hl="warm" />
              </>
            }
          >
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-medium tracking-[-0.035em] text-[#f7f8f8] tabular-nums">96</span>
              <span className="inline-flex items-center gap-0.5 font-mono text-xs text-[#4ade80]">▲ 23</span>
            </div>
          </KpiCard>
          <KpiCard
            title="Credits used"
            iconTint="bg-[rgba(94,106,210,0.12)] text-[#c9c4ff]"
            meta="of 2,500 · resets in 11 days"
            spark={
              <>
                <SparkBar pct={32} />
                <SparkBar pct={44} />
                <SparkBar pct={51} />
                <SparkBar pct={58} />
                <SparkBar pct={62} />
                <SparkBar pct={67} />
                <SparkBar pct={74} />
              </>
            }
          >
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-medium tracking-[-0.035em] text-[#f7f8f8] tabular-nums">1,548</span>
              <span className="font-mono text-xs text-[#8a8f98]">62%</span>
            </div>
          </KpiCard>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.7fr_1fr]">
          <CardShell
            title="Score distribution"
            sub="Account count by band over the last 7 days"
            actions={
              <>
                <span className="cursor-pointer rounded px-2 py-0.5 font-mono text-[11px] text-[#8a8f98]">Count</span>
                <span className="cursor-pointer rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-[#f7f8f8]">
                  Stacked
                </span>
                <span className="cursor-pointer rounded px-2 py-0.5 font-mono text-[11px] text-[#8a8f98]">% Share</span>
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 text-xs text-[#8a8f98]">
              <span className="inline-flex items-baseline gap-2">
                <span className="h-2 w-2 rounded-sm bg-[#4ade80]" /> HOT{" "}
                <span className="font-mono text-[13px] font-semibold text-[#f7f8f8]">12</span>
              </span>
              <span className="inline-flex items-baseline gap-2">
                <span className="h-2 w-2 rounded-sm bg-[#f5b544]" /> Warming{" "}
                <span className="font-mono text-[13px] font-semibold text-[#f7f8f8]">38</span>
              </span>
              <span className="inline-flex items-baseline gap-2">
                <span className="h-2 w-2 rounded-sm bg-[#8a8f98]" /> Cold{" "}
                <span className="font-mono text-[13px] font-semibold text-[#f7f8f8]">197</span>
              </span>
              <span className="ml-auto font-mono text-[11px] text-[#62666d]">↗ Avg score 64.2 (▲ 1.8)</span>
            </div>
            <div className="relative mt-3">
              <svg className="block h-[240px] w-full" viewBox="0 0 800 240" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="hotGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity="0.04" />
                  </linearGradient>
                  <linearGradient id="warmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5b544" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#f5b544" stopOpacity="0.04" />
                  </linearGradient>
                  <linearGradient id="coldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8a8f98" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#8a8f98" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
                  {[0, 60, 120, 180, 240].map((y) => (
                    <line key={y} x1="0" y1={y} x2="800" y2={y} />
                  ))}
                </g>
                <path
                  d="M 0,240 L 0,140 C 50,138 100,142 150,135 S 250,128 300,125 S 400,120 450,118 S 550,114 600,116 S 700,108 800,102 L 800,240 Z"
                  fill="url(#coldGrad)"
                />
                <path
                  d="M 0,108 C 50,104 100,110 150,98 S 250,84 300,82 S 400,72 450,68 S 550,58 600,60 S 700,46 800,42"
                  fill="none"
                  stroke="#f5b544"
                  strokeWidth="1.6"
                  opacity="0.7"
                />
                <path
                  d="M 0,82 C 50,78 100,86 150,72 S 250,58 300,56 S 400,44 450,42 S 550,28 600,30 S 700,16 800,12"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="mt-1.5 grid grid-cols-8 font-mono text-[11px] text-[#62666d]">
              {["Mar 14", "Mar 15", "Mar 16", "Mar 17", "Mar 18", "Mar 19", "Mar 20", "Today"].map((d) => (
                <div key={d} className="text-center">
                  {d}
                </div>
              ))}
            </div>
          </CardShell>

          <CardShell title="Recent activity" sub="Score events and signal triggers" dense>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 divide-y divide-white/[0.04] overflow-auto">
                {[
                  {
                    line: (
                      <>
                        <strong className="font-medium">Stripe</strong> moved to{" "}
                        <span className="rounded border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.1)] px-1 font-mono text-[11px] text-[#4ade80]">
                          HOT 94
                        </span>{" "}
                        on Series H signal
                      </>
                    ),
                    meta: "Funding · ▲ 12 · auto-routed to D. Marwan",
                    t: "3m",
                    dot: "hot",
                  },
                  {
                    line: (
                      <>
                        Autopilot <strong className="font-medium">when_account_goes_hot</strong> fired on{" "}
                        <strong className="font-medium">Anthropic</strong>
                      </>
                    ),
                    meta: "3 actions · email drafted · #pipeline notified",
                    t: "14m",
                    dot: "blue",
                  },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-[18px_1fr_auto] gap-2.5 px-4 py-2.5 text-[13px]">
                    <div className="mt-0.5 grid place-items-center">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          row.dot === "hot" && "bg-[#4ade80] shadow-[0_0_6px_#4ade80]",
                          row.dot === "blue" && "bg-[#7170ff] shadow-[0_0_6px_rgba(113,112,255,0.5)]"
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="leading-snug text-[#f7f8f8]">{row.line}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-[#8a8f98]">{row.meta}</p>
                    </div>
                    <span className="whitespace-nowrap font-mono text-[11px] text-[#62666d]">{row.t}</span>
                  </div>
                ))}
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-white/[0.04] px-4 py-2.5 text-xs text-[#8a8f98]">
                <span>Showing 8 of 247</span>
                <Link href="/history" className="font-medium text-[#b4bbc8] hover:text-[#f7f8f8]">
                  View activity log →
                </Link>
              </div>
            </div>
          </CardShell>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <CardShell title="Top movers · 7 days" sub="Biggest score deltas across your tracked accounts" dense>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 divide-y divide-white/[0.04] overflow-auto">
              {[
                { n: "Anthropic", r: "News + funding · 5 axes lit", s: 96, d: "+24", av: "bg-gradient-to-br from-[#4ec9d8] to-[#5e6ad2]" },
                { n: "Stripe", r: "Series H · $6.5B", s: 94, d: "+12", av: "bg-gradient-to-br from-[#4ade80] to-[#22c55e]" },
              ].map((m) => (
                <div
                  key={m.n}
                  className="grid cursor-pointer grid-cols-[28px_1fr_50px_56px] items-center gap-2.5 px-4 py-2 hover:bg-white/[0.02]"
                >
                  <span className={`grid h-6 w-6 place-items-center rounded text-[10px] font-bold text-[#0a0b0f] ${m.av}`}>
                    {m.n[0]}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[#f7f8f8]">{m.n}</div>
                    <div className="truncate font-mono text-[11px] text-[#8a8f98]">{m.r}</div>
                  </div>
                  <span className="text-right font-mono text-sm font-semibold tabular-nums text-[#f7f8f8]">{m.s}</span>
                  <span className="text-right font-mono text-xs text-[#4ade80]">▲ {m.d.replace("+", "")}</span>
                </div>
              ))}
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-white/[0.04] px-4 py-2.5 text-xs text-[#8a8f98]">
                <span>6 of 24 movers</span>
                <Link href="/watchlist" className="font-medium text-[#b4bbc8] hover:text-[#f7f8f8]">
                  View all movers →
                </Link>
              </div>
            </div>
          </CardShell>

          <CardShell title="Pipeline by band" sub="247 tracked accounts" dense>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto px-[18px] py-4">
              {[
                { l: "HOT", n: 12, pct: 4.9, c: "bg-[#4ade80]", glow: true },
                { l: "Warming", n: 38, pct: 15.4, c: "bg-[#f5b544]" },
                { l: "Cold", n: 191, pct: 77.3, c: "bg-[#8a8f98]" },
              ].map((p) => (
                <div key={p.l}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-[#f7f8f8]">
                      <span
                        className={cn("h-2 w-2 rounded-full", p.c, p.glow && "shadow-[0_0_6px_#4ade80]")}
                      />
                      {p.l}
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-[#f7f8f8]">
                      {p.n}
                      <span className="ml-1 text-[11px] font-normal text-[#8a8f98]">{p.pct}%</span>
                    </span>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className={cn("h-full rounded-full", p.c)} style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-white/[0.04] px-4 py-2.5 text-xs">
                <span className="font-mono text-[#62666d]">+50 net moved up this week</span>
                <Link href="/pipeline" className="font-medium text-[#b4bbc8] hover:text-[#f7f8f8]">
                  Open Intent Hub →
                </Link>
              </div>
            </div>
          </CardShell>

          <CardShell title="Signal mix" sub="Avg contribution across your HOT band">
            <div>
            <div className="grid grid-cols-[130px_1fr] items-center gap-[18px] px-5 py-[18px]">
              <div className="relative mx-auto aspect-square w-[130px]">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#4ec9d8" strokeWidth="14" strokeDasharray="65.3 251.3" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#4ade80" strokeWidth="14" strokeDasharray="55.3 251.3" strokeDashoffset="-65.3" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f5b544" strokeWidth="14" strokeDasharray="52.8 251.3" strokeDashoffset="-120.6" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#7170ff" strokeWidth="14" strokeDasharray="45.2 251.3" strokeDashoffset="-173.4" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#ec4899" strokeWidth="14" strokeDasharray="32.7 251.3" strokeDashoffset="-218.6" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-medium tracking-[-0.024em] text-[#f7f8f8]">87.4</span>
                  <span className="mt-1 text-[10px] uppercase tracking-wider text-[#8a8f98]">avg HOT</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                {[
                  ["#4ec9d8", "Funding", "26%"],
                  ["#4ade80", "Hiring", "22%"],
                  ["#f5b544", "News", "21%"],
                  ["#7170ff", "Tech stack", "18%"],
                  ["#ec4899", "Web presence", "13%"],
                ].map(([c, n, pct]) => (
                  <div key={n} className="grid grid-cols-[14px_1fr_auto] items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c as string }} />
                    <span className="text-[#b4bbc8]">{n}</span>
                    <span className="font-mono font-medium tabular-nums text-[#f7f8f8]">{pct}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-2.5 text-xs">
              <span className="font-mono text-[#62666d]">last 7 days</span>
              <Link href="/score" className="font-medium text-[#b4bbc8] hover:text-[#f7f8f8]">
                Tune weights →
              </Link>
            </div>
            </div>
          </CardShell>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-[#0e1011]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-[18px] py-3.5">
            <div>
              <div className="text-[13px] font-medium text-[#f7f8f8]">Watchlist · 7-day score trend</div>
              <div className="text-xs text-[#8a8f98]">24 pinned accounts · sparkline shows daily score</div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="rounded-md px-2.5 py-1 text-[13px] text-[#b4bbc8] hover:bg-white/[0.04]">
                Filter
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-4 sm:grid-cols-4 lg:grid-cols-8">
            {["Stripe", "Anthropic", "Linear", "Notion"].map((name) => (
              <div
                key={name}
                className="cursor-pointer rounded border border-white/[0.04] bg-[#131517] p-2.5 transition-colors hover:border-white/[0.13] hover:bg-[#1a1d20]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-medium text-[#f7f8f8]">{name}</span>
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-[#4ade80] tabular-nums">94</span>
                </div>
                <div className="mt-2 flex h-[22px] items-end gap-px">
                  {[40, 44, 48, 52, 58, 62, 70].map((h, i) => (
                    <div key={i} className="min-w-px flex-1 rounded-[1px] bg-white/[0.08]" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <CardShell
          title="Autopilot · status"
          sub="3 active workflows · 412 fires this month"
          actions={
            <Link
              href="/autopilot"
              className="rounded-md border border-white/[0.08] px-2.5 py-1 text-[13px] text-[#b4bbc8] hover:border-white/[0.13]"
            >
              New workflow
            </Link>
          }
          dense
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 divide-y divide-white/[0.04] overflow-auto">
            {[
              { n: "when_account_goes_hot", d: "band → HOT · ICP fit ≥ 70 → route + draft + notify", f: "128", r: "94%" },
              { n: "funding_announced", d: "signal: Series A+ · industry ∈ {Fintech, SaaS}", f: "42", r: "88%" },
            ].map((a) => (
              <div
                key={a.n}
                className="grid cursor-pointer grid-cols-[16px_1fr_80px_90px] items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-white/[0.02] lg:grid-cols-[16px_1fr_80px_90px_60px]"
              >
                <span className="h-2 w-2 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80]" />
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs font-medium text-[#f7f8f8]">{a.n}</div>
                  <div className="truncate text-[11px] text-[#8a8f98]">{a.d}</div>
                </div>
                <div className="text-right font-mono text-[13px] font-medium text-[#f7f8f8]">
                  {a.f}
                  <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-[#8a8f98]">
                    Fires
                  </span>
                </div>
                <div className="text-right font-mono text-[13px] font-medium text-[#f7f8f8]">
                  {a.r}
                  <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-[#8a8f98]">
                    Match rate
                  </span>
                </div>
                <div className="hidden lg:block">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.1)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#4ade80]">
                    <span className="h-1 w-1 rounded-full bg-[#4ade80]" />
                    Active
                  </span>
                </div>
              </div>
            ))}
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-white/[0.04] px-4 py-2.5 text-xs">
              <span className="font-mono text-[#62666d]">avg latency 1.4s · 4 of 5 workflows used</span>
              <Link href="/autopilot" className="font-medium text-[#b4bbc8] hover:text-[#f7f8f8]">
                Open Autopilot →
              </Link>
            </div>
          </div>
        </CardShell>

        <p className="pt-2 text-center text-xs text-[#62666d]">
          <Link href="/analyze" className="text-[#7170ff] hover:text-[#c9c4ff]">
            Open Analyze chat
          </Link>
          {" · "}
          Mock metrics match the HTML reference; wire to APIs when ready.
        </p>
      </div>
    </div>
  );
}
