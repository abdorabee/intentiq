import Link from "next/link";
import { Button } from "@/components/ui/button";
import IntentIQLogo from "@/components/intentiq-logo";

const PRICING = [
  { plan: "Free",    price: "$0",    credits: "20",     cta: "Start Free" },
  { plan: "Starter", price: "$49",   credits: "500",    cta: "Get Started" },
  { plan: "Growth",  price: "$149",  credits: "2,500",  cta: "Get Started", highlight: true },
  { plan: "Pro",     price: "$299",  credits: "8,000",  cta: "Get Started" },
  { plan: "Agency",  price: "$499",  credits: "25,000", cta: "Get Started" },
];

const COMPARISON = [
  { name: "6sense",          price: "$50K+/yr", smb: false, api: false, ai: false, mena: false },
  { name: "Bombora",         price: "$25K+/yr", smb: false, api: false, ai: false, mena: false },
  { name: "ZoomInfo Intent", price: "$15K+/yr", smb: false, api: false, ai: false, mena: true  },
  { name: "Apollo Intent",   price: "$49/mo+",  smb: true,  api: true,  ai: false, mena: true  },
  { name: "VesperWise",        price: "$49/mo",   smb: true,  api: true,  ai: true,  mena: true, you: true },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit a domain",
    body: "Pass any company domain via our REST API or the dashboard UI. No CRM integration required.",
    gradient: "from-violet-500 to-indigo-400",
  },
  {
    step: "02",
    title: "5 live signals fetched in parallel",
    body: "Funding rounds, hiring velocity, news triggers, tech stack, and web presence — all fetched simultaneously.",
    gradient: "from-indigo-400 to-violet-500",
  },
  {
    step: "03",
    title: "Weighted intent score computed",
    body: "A composite 0–100 score with configurable signal weights. HOT ≥75, WARM ≥50, COLD <50.",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    step: "04",
    title: "AI reasoning + recommended action",
    body: "Claude generates a plain-English summary, a 'why now' insight, and a specific outreach action to take.",
    gradient: "from-indigo-500 to-violet-500",
  },
];

function Check({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
      <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08]">
      <svg className="h-3 w-3 text-slate-600" viewBox="0 0 12 12" fill="none">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </span>
  );
}

// Per-row signal mix: 5 segments [green, amber, indigo, purple, pink], widths vary per row
const MOCK_ACCOUNTS = [
  {
    name: "Stripe",    domain: "stripe.com",    initial: "S", color: "bg-[#635bff]/25 text-[#a79fff]",
    signal: "Series H · $6.5B",              up: true,  score: 94, scoreColor: "text-[#4ade80]",
    mix: [[52,"#4ade80"],[20,"#f5b544"],[14,"#dfff00"],[10,"#a855f7"],[0,""]],
    owner: "D. Marwan", ownerColor: "bg-violet-500/30 text-violet-300",
    updated: "3h", delta: "+12", deltaUp: true,
  },
  {
    name: "Linear",    domain: "linear.app",    initial: "L", color: "bg-indigo-500/25 text-indigo-300",
    signal: "+18 Eng. hires this quarter",   up: true,  score: 82, scoreColor: "text-[#4ade80]",
    mix: [[36,"#4ade80"],[24,"#dfff00"],[20,"#f5b544"],[12,"#a855f7"],[8,"#f43f5e"]],
    owner: "J. Sato",   ownerColor: "bg-emerald-500/30 text-emerald-300",
    updated: "9h",  delta: "+4",  deltaUp: true,
  },
  {
    name: "Anthropic", domain: "anthropic.com", initial: "A", color: "bg-orange-500/25 text-orange-300",
    signal: "TechCrunch coverage",           up: true,  score: 96, scoreColor: "text-[#4ade80]",
    mix: [[60,"#4ade80"],[16,"#f5b544"],[12,"#dfff00"],[8,"#a855f7"],[4,"#f43f5e"]],
    owner: "A. Chen",   ownerColor: "bg-sky-500/30 text-sky-300",
    updated: "14h", delta: "+7",  deltaUp: true,
  },
  {
    name: "Vercel",    domain: "vercel.com",    initial: "V", color: "bg-slate-600/40 text-slate-300",
    signal: "Detected: Segment, Snowflake",  up: true,  score: 67, scoreColor: "text-[#f5b544]",
    mix: [[28,"#f5b544"],[28,"#4ade80"],[20,"#dfff00"],[16,"#a855f7"],[8,"#f43f5e"]],
    owner: "D. Marwan", ownerColor: "bg-violet-500/30 text-violet-300",
    updated: "1h",  delta: "+2",  deltaUp: true,
  },
  {
    name: "Notion",    domain: "notion.so",     initial: "N", color: "bg-slate-700/50 text-slate-200",
    signal: "Pricing-page traffic spike",    up: true,  score: 78, scoreColor: "text-[#4ade80]",
    mix: [[44,"#4ade80"],[24,"#dfff00"],[16,"#f5b544"],[10,"#a855f7"],[6,"#f43f5e"]],
    owner: "R. Backer", ownerColor: "bg-amber-500/30 text-amber-300",
    updated: "2h",  delta: "-6",  deltaUp: false,
  },
  {
    name: "Figma",     domain: "figma.com",     initial: "F", color: "bg-pink-500/25 text-pink-300",
    signal: "Config '26 keynote",            up: true,  score: 71, scoreColor: "text-[#f5b544]",
    mix: [[32,"#4ade80"],[28,"#f5b544"],[20,"#dfff00"],[12,"#a855f7"],[8,"#f43f5e"]],
    owner: "J. Sato",   ownerColor: "bg-emerald-500/30 text-emerald-300",
    updated: "3h",  delta: "+5",  deltaUp: true,
  },
  {
    name: "Mixpanel",  domain: "mixpanel.com",  initial: "M", color: "bg-purple-600/25 text-purple-300",
    signal: "No new signals",                up: false, score: 38, scoreColor: "text-slate-500",
    mix: [[20,""],[16,""],[14,""],[12,""],[10,""]],
    owner: "Unassigned",ownerColor: "bg-emerald-500/30 text-emerald-300",
    updated: "1d",  delta: "-3",  deltaUp: false,
  },
] as const;

type MockAccount = typeof MOCK_ACCOUNTS[number];

function SignalMixBar({ mix }: { mix: MockAccount["mix"] }) {
  return (
    <div className="flex gap-[3px] items-center">
      {mix.map(([w, color], i) => (
        <div
          key={i}
          className="h-[5px] rounded-full"
          style={{
            width: w,
            background: color || "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

function OwnerAvatar({ name, colorCls }: { name: string; colorCls: string }) {
  const initials = name === "Unassigned" ? "?" : name.split(" ").map(p => p[0]).join("").slice(0, 2);
  return (
    <div className={`inline-flex h-5 w-5 rounded-full items-center justify-center text-[9px] font-bold flex-shrink-0 ${colorCls}`}>
      {initials}
    </div>
  );
}

function ProductMockup() {
  return (
    <div
      className="relative mt-14 mx-auto max-w-5xl rounded-xl overflow-hidden pointer-events-none select-none"
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#09090b",
        boxShadow: "0 0 0 1px rgba(223,255,0,0.15), 0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(223,255,0,0.08)",
      }}
    >
      {/* ── Top chrome bar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.07] bg-[#0a0b0e]">
        {/* Workspace selector */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <IntentIQLogo size={18} />
          <span className="text-[11px] font-semibold text-slate-200">Acme Sales</span>
          <svg className="h-3 w-3 text-slate-600" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="h-3.5 w-px bg-white/[0.08]" />
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-500">Workspace</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-200 font-medium">Intent Hub</span>
        </div>
        {/* Signal badges */}
        <div className="flex items-center gap-1.5 ml-1">
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-[#4ade80]"
            style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.2)" }}>
            ● HOT <span className="font-black">12</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-[#f5b544]"
            style={{ background: "rgba(245,181,68,0.12)", border: "1px solid rgba(245,181,68,0.2)" }}>
            ● 6&amp;8M <span className="font-black">39</span>
          </span>
        </div>
        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-slate-500"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 8l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Search <span className="text-[#e8ff40] font-semibold">ai</span>
          </div>
          <div className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-slate-500"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
              <path d="M2 4h8M3.5 6h5M5 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Filter
          </div>
          <div className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-slate-500"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            Today
            <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold text-black"
            style={{ background: "#dfff00" }}>
            + Score account
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex" style={{ minHeight: 340 }}>

        {/* Sidebar */}
        <div className="flex flex-col flex-shrink-0 border-r border-white/[0.07] bg-[#09090b] py-3"
          style={{ width: 176 }}>
          <p className="px-3 pb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-600">Workspace</p>
          {([
            { label: "Intent Hub", active: true },
            { label: "Score" },
            { label: "Pipeline" },
            { label: "People" },
            { label: "Watchlist", badge: "34" },
            { label: "Autopilot", dot: true },
            { label: "Inbox", badge: "12" },
          ] as const).map((item) => (
            <div key={item.label}
              className={`mx-1.5 flex items-center justify-between rounded-md px-2 py-[5px] text-[11px] ${
                "active" in item && item.active
                  ? "font-medium"
                  : "text-slate-500"
              }`}
              style={"active" in item && item.active ? { background: "rgba(223,255,0,0.14)", color: "#dfff00" } : {}}>
              <span>{item.label}</span>
              {"badge" in item && item.badge && (
                <span className="text-[9px] rounded px-1 py-px text-slate-500"
                  style={{ background: "rgba(255,255,255,0.06)" }}>{item.badge}</span>
              )}
              {"dot" in item && item.dot && (
                <span className="h-[6px] w-[6px] rounded-full bg-[#dfff00]" />
              )}
            </div>
          ))}

          <p className="px-3 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-600">Settings</p>
          {["Settings", "Billing"].map(label => (
            <div key={label} className="mx-1.5 flex items-center rounded-md px-2 py-[5px] text-[11px] text-slate-500">
              {label}
            </div>
          ))}

          {/* Credits */}
          <div className="mt-auto mx-3 pt-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Credits</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[15px] font-black text-slate-100 tabular-nums">1,548</span>
              <span className="text-[9px] text-slate-600">/ 2,500</span>
            </div>
            <div className="h-[3px] rounded-full mb-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="h-full rounded-full" style={{ width: "62%", background: "#dfff00" }} />
            </div>
            <span className="text-[9px] font-semibold text-[#e8ff40]">Top up</span>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Filter bar */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05]">
            <div className="flex items-center gap-1 rounded-md px-2 py-[3px] text-[10px] text-slate-400"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
              All accounts
              <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="flex items-center gap-1 rounded-md px-2 py-[3px] text-[10px] font-medium text-[#dfff00]"
              style={{ background: "rgba(223,255,0,0.14)", border: "1px solid rgba(223,255,0,0.25)" }}>
              Score &gt; 75
            </div>
            <div className="flex items-center gap-1 rounded-md px-2 py-[3px] text-[10px] text-slate-400"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              Industry: SaaS
              <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rounded-md px-2 py-[3px] text-[10px] text-slate-600"
              style={{ border: "1px dashed rgba(255,255,255,0.1)" }}>
              + Add filter
            </div>
            <span className="ml-auto text-[10px] text-slate-600">247 results</span>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {(["Account","Signal","Score","Signal Mix","Owner","Updated"] as const).map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_ACCOUNTS.map((acc) => (
                <tr key={acc.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {/* Account */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-6 w-6 rounded-[5px] items-center justify-center text-[11px] font-bold flex-shrink-0 ${acc.color}`}>
                        {acc.initial}
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-200 leading-tight">{acc.name}</p>
                        <p className="text-[9px] text-slate-600">{acc.domain}</p>
                      </div>
                    </div>
                  </td>
                  {/* Signal */}
                  <td className="px-4 py-2 max-w-[160px]">
                    <div className="flex items-start gap-1">
                      {acc.up
                        ? <span className="text-[10px] text-[#dfff00] flex-shrink-0 mt-px">↑</span>
                        : <span className="text-[10px] text-slate-600 flex-shrink-0 mt-px">○</span>
                      }
                      <span className="text-[11px] text-slate-400 leading-snug">{acc.signal}</span>
                    </div>
                  </td>
                  {/* Score */}
                  <td className="px-4 py-2">
                    <span className={`text-[13px] font-bold tabular-nums ${acc.scoreColor}`}>{acc.score}</span>
                  </td>
                  {/* Signal Mix */}
                  <td className="px-4 py-2">
                    <SignalMixBar mix={acc.mix} />
                  </td>
                  {/* Owner */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <OwnerAvatar name={acc.owner} colorCls={acc.ownerColor} />
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{acc.owner}</span>
                    </div>
                  </td>
                  {/* Updated */}
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="text-[10px] text-slate-500">{acc.updated}</span>
                    {" "}
                    <span className={`text-[9px] font-semibold ${acc.deltaUp ? "text-[#4ade80]" : "text-red-400"}`}>
                      {acc.deltaUp ? "▲" : "▼"} {acc.delta.replace(/[+-]/, "")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#08090a] overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-60 -left-40 w-[900px] h-[900px] rounded-full bg-[#dfff00]/8 blur-[160px] animate-orb" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-[#e8ff40]/6 blur-[140px] animate-orb-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#dfff00]/5 blur-[120px] animate-orb-med" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 glass-nav border-b border-white/[0.06]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <IntentIQLogo size={24} />
            <span className="text-sm font-bold text-white">VesperWise</span>
          </div>
          <div className="hidden md:flex items-center gap-0.5">
            {["Product", "Autopilot", "Developers", "Pricing", "Customers", "Company"].map((item) => (
              <a
                key={item}
                href={item === "Pricing" ? "#pricing" : "#"}
                className="flex items-center gap-0.5 rounded-md px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
              >
                {item}
                {(item === "Product" || item === "Company") && (
                  <svg className="h-3.5 w-3.5 text-slate-600" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-md text-sm text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]"
            asChild
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button
            className="rounded-md bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] text-slate-200 text-sm"
            asChild
          >
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-4 text-center">
        {/* Badge pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#dfff00]/35 bg-[#dfff00]/10 px-3.5 py-1.5 text-sm mb-8">
          <span className="rounded-full bg-[#dfff00] px-2 py-0.5 text-[10px] font-bold text-black">Spring &apos;26</span>
          <span className="text-slate-300">People scoring + warm-account routing</span>
          <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[1.05] text-white mb-6">
          Pipeline <span className="text-gradient">intelligence</span>
          <br />
          for B2B sales teams.
        </h1>

        {/* Subtext */}
        <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
          VesperWise scores every account in your pipeline on a 0–100 buying-intent scale — live signals, AI reasoning, and the next move, in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center mb-5">
          <Button
            size="lg"
            className="rounded-full bg-[#dfff00] hover:bg-[#e8ff40] text-black border-0 px-7 text-sm font-semibold"
            asChild
          >
            <Link href="/signup">Start scoring free →</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-white/[0.14] text-slate-300 hover:text-slate-100 hover:bg-white/[0.06] px-7 text-sm"
            asChild
          >
            <Link href="#demo">Book a demo</Link>
          </Button>
        </div>

        {/* Social proof */}
        <p className="text-xs text-slate-500 mb-0">
          20 free credits
          <span className="mx-2 text-slate-700">·</span>
          No credit card
          <span className="mx-2 text-slate-700">·</span>
          Results in &lt; 3 seconds
        </p>

        {/* Product mockup */}
        <ProductMockup />
      </section>

      {/* Problem Statement */}
      <section className="max-w-4xl mx-auto px-6 py-16 mt-10">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { stat: "78%", label: "of outreach goes to cold accounts", note: "Industry average", color: "from-red-500/20 to-amber-500/10", border: "border-red-500/20", text: "text-red-400" },
            { stat: "2.1h", label: "wasted per rep per day on bad leads", note: "Per Gartner, 2024", color: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/20", text: "text-amber-400" },
            { stat: "3 sec", label: "for VesperWise to score any company", note: "Avg API response time", color: "from-emerald-500/15 to-cyan-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
          ].map((item) => (
            <div key={item.stat} className={`rounded-2xl glass border ${item.border} p-6 space-y-2 bg-gradient-to-br ${item.color}`}>
              <p className={`text-5xl font-black ${item.text}`}>{item.stat}</p>
              <p className="text-slate-300 font-medium leading-snug">{item.label}</p>
              <p className="text-xs text-slate-500">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code Demo */}
      <section id="demo" className="py-24">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">One API call.</h2>
            <p className="text-slate-400">Works with curl, JavaScript, Python — or any HTTP client.</p>
          </div>
          <div className="rounded-2xl glass overflow-hidden">
            <div className="flex items-center gap-1.5 bg-white/[0.04] px-4 py-3 border-b border-white/[0.06]">
              <span className="h-3 w-3 rounded-full bg-red-500/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
              <span className="ml-3 text-xs text-slate-500 font-mono">vesperwise — api</span>
            </div>
            <pre className="text-emerald-400 p-6 text-sm overflow-x-auto leading-relaxed bg-transparent">
{`# curl
curl "https://intentiq.com/api/v1/score?domain=acme.com" \\
  -H "Authorization: Bearer YOUR_KEY"

# JavaScript
const score = await fetch(
  'https://intentiq.com/api/v1/score?domain=acme.com',
  { headers: { Authorization: 'Bearer YOUR_KEY' } }
).then(r => r.json());

# Python
import requests
score = requests.get(
    'https://intentiq.com/api/v1/score',
    params={'domain': 'acme.com'},
    headers={'Authorization': 'Bearer YOUR_KEY'}
).json()`}
            </pre>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">How it works</h2>
          <p className="text-slate-400">From domain to deal signal in under 3 seconds.</p>
        </div>
        <div className="space-y-10">
          {HOW_IT_WORKS.map((item, idx) => (
            <div
              key={item.step}
              className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 1 ? "md:flex-row-reverse" : ""}`}
            >
              <div className="flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl glass border-white/[0.1] relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10`} />
                <span className={`text-2xl font-black bg-gradient-to-br ${item.gradient} bg-clip-text text-transparent relative z-10`}>
                  {item.step}
                </span>
              </div>
              <div className="space-y-1 text-center md:text-left flex-1">
                <h3 className="text-xl font-bold text-slate-100">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-4xl mx-auto px-6 py-20 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">&ldquo;Our reps stopped guessing.&rdquo;</h2>
          <p className="text-slate-400">Sales teams using VesperWise 3× their connect rates in 30 days.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              quote: "I used to cold call 80 companies a day. Now I call 20 — the HOT ones. My connect rate tripled.",
              name: "Sarah K.",
              role: "SDR",
              company: "Growthline",
            },
            {
              quote: "The Pipeline Board alone is worth the subscription. I can see which accounts are heating up before my competitors call them.",
              name: "Marcus T.",
              role: "Account Executive",
              company: "Nexflow",
            },
            {
              quote: "Our team cut outreach time by 60% in the first month. The AI talk tracks are actually good.",
              name: "Priya M.",
              role: "Sales Manager",
              company: "Veloce",
            },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl glass border border-white/[0.08] p-6 space-y-4 flex flex-col">
              <p className="text-slate-300 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#dfff00]/30 to-[#e8ff40]/20 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#dfff00]">{t.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-4xl mx-auto px-6 py-24 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">How we compare</h2>
          <p className="text-slate-400">Honest side-by-side. No asterisks.</p>
        </div>
        <div className="rounded-2xl glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                {["Product", "Price", "SMB-Friendly", "API-First", "AI Reasoning", "MENA Coverage"].map((h) => (
                  <th key={h} className="px-5 py-4 text-left font-semibold text-xs uppercase tracking-wide text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {COMPARISON.map((c) => (
                <tr
                  key={c.name}
                  className={c.you ? "bg-[#dfff00]/10" : "hover:bg-white/[0.02] transition-colors"}
                >
                  <td className="px-5 py-4 font-medium">
                    {c.you ? (
                      <span className="font-bold text-[#dfff00] flex items-center gap-1.5">
                        {c.name}
                        <span className="inline-flex items-center rounded-full bg-[#dfff00]/20 border border-[#dfff00]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#dfff00] tracking-wide">
                          YOU
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-300">{c.name}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-mono text-xs">{c.price}</td>
                  <td className="px-5 py-4"><Check yes={c.smb} /></td>
                  <td className="px-5 py-4"><Check yes={c.api} /></td>
                  <td className="px-5 py-4"><Check yes={c.ai} /></td>
                  <td className="px-5 py-4"><Check yes={c.mena} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-24 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">Simple pricing</h2>
          <p className="text-slate-400">Pay for what you score. No annual lock-in.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {PRICING.map((p) => (
            <div
              key={p.plan}
              className={`flex flex-col rounded-2xl p-5 gap-4 glass ${
                p.highlight
                  ? "border-[#dfff00]/40 shadow-[0_0_40px_rgba(223,255,0,0.2)]"
                  : "border-white/[0.08]"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-slate-200">{p.plan}</p>
                  {p.highlight && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#dfff00] bg-[#dfff00]/15 border border-[#dfff00]/30 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-slate-100">
                  {p.price}
                  <span className="text-sm font-normal text-slate-500">/mo</span>
                </p>
              </div>
              <p className="text-sm text-slate-400">{p.credits} credits</p>
              <Button
                className={`w-full rounded-full mt-auto cursor-pointer ${
                  p.highlight
                    ? "bg-[#dfff00] hover:bg-[#e8ff40] text-black border-0"
                    : "border-white/[0.12] text-slate-300 hover:text-slate-100 hover:bg-white/[0.05]"
                }`}
                variant={p.highlight ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href="/signup">{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-slate-500">
          Pay-as-you-go also available at $0.08/credit. No annual contracts.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IntentIQLogo size={20} />
            <span className="font-bold text-slate-200 text-sm">VesperWise</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} VesperWise · Built for B2B sales teams
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link href="/login" className="hover:text-slate-200 transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-slate-200 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
