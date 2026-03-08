import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  { name: "IntentIQ",        price: "$49/mo",   smb: true,  api: true,  ai: true,  mena: true, you: true },
];

const MARQUEE_COMPANIES = [
  { name: "Stripe",     score: 91, band: "HOT",  cls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  { name: "Notion",     score: 78, band: "HOT",  cls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  { name: "Linear",     score: 82, band: "HOT",  cls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  { name: "Vercel",     score: 67, band: "WARM", cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  { name: "Figma",      score: 71, band: "WARM", cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  { name: "Loom",       score: 44, band: "COLD", cls: "bg-slate-500/20 text-slate-400 border border-slate-500/30" },
  { name: "Intercom",   score: 88, band: "HOT",  cls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  { name: "Hubspot",    score: 55, band: "WARM", cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  { name: "Salesforce", score: 93, band: "HOT",  cls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  { name: "Mixpanel",   score: 38, band: "COLD", cls: "bg-slate-500/20 text-slate-400 border border-slate-500/30" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit a domain",
    body: "Pass any company domain via our REST API or the dashboard UI. No CRM integration required.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    step: "02",
    title: "5 live signals fetched in parallel",
    body: "Funding rounds, hiring velocity, news triggers, tech stack, and web presence — all fetched simultaneously.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    step: "03",
    title: "Weighted intent score computed",
    body: "A composite 0–100 score with configurable signal weights. HOT ≥75, WARM ≥50, COLD <50.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    step: "04",
    title: "AI reasoning + recommended action",
    body: "Claude generates a plain-English summary, a 'why now' insight, and a specific outreach action to take.",
    gradient: "from-emerald-500 to-teal-500",
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

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#020617] overflow-x-hidden">
      {/* Global ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-60 -left-40 w-[900px] h-[900px] rounded-full bg-indigo-600/12 blur-[160px] animate-orb" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[140px] animate-orb-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-[120px] animate-orb-med" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-600/6 blur-[100px] animate-orb" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 glass-nav border-b-0 border-r-0 border-b border-white/[0.06]">
        <span className="text-xl font-black text-gradient">IntentIQ</span>
        <div className="hidden md:flex items-center gap-1">
          <Link href="/docs" className="rounded-full px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors cursor-pointer">
            Docs
          </Link>
          <a href="#demo" className="rounded-full px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors cursor-pointer">
            API
          </a>
          <a href="#pricing" className="rounded-full px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors cursor-pointer">
            Pricing
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="rounded-full text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] cursor-pointer"
            asChild
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            className="rounded-full bg-indigo-500 hover:bg-indigo-400 text-white border-0 cursor-pointer"
            asChild
          >
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-28 pb-16 text-center">
        <div className="relative space-y-7">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-medium text-slate-300">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Now in beta — 20 free credits, no card required
          </div>

          {/* Headline with CSS word rotation */}
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight text-slate-100">
            Score{" "}
            <span className="relative inline-block text-gradient">
              <span className="animate-word-rotate" style={{ animationDelay: "0s" }}>Your Pipeline</span>
              <span className="animate-word-rotate" style={{ animationDelay: "3s" }}>SaaS Startups</span>
              <span className="animate-word-rotate" style={{ animationDelay: "6s" }}>Enterprise Accounts</span>
              <span className="animate-word-rotate" style={{ animationDelay: "9s" }}>Ideal Customers</span>
              {/* Ghost span holds width of longest word */}
              <span aria-hidden className="invisible">Enterprise Accounts</span>
            </span>
            {" "}for Buying Intent
          </h1>

          {/* Sub-copy */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            One API call. Any company. A composite intent score (0–100) with AI reasoning
            and a specific action — in under 3 seconds. No setup. No contract. From $49/mo.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              className="rounded-full bg-indigo-500 hover:bg-indigo-400 text-white border-0 px-8 cursor-pointer"
              asChild
            >
              <Link href="/signup">Start free — 20 credits</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/[0.12] text-slate-300 hover:text-slate-100 hover:bg-white/[0.05] px-8 cursor-pointer"
              asChild
            >
              <Link href="#demo">See live demo</Link>
            </Button>
          </div>

          <p className="text-sm text-slate-500">
            6sense charges $50,000+/year for the same output. You pay $49/month.
          </p>

          {/* Scrolling marquee of scored companies */}
          <div className="relative mt-10 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-[#020617] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-[#020617] to-transparent" />
            <div className="flex overflow-hidden">
              <div className="animate-marquee flex gap-3">
                {[...MARQUEE_COMPANIES, ...MARQUEE_COMPANIES].map((co, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 flex items-center gap-3 rounded-full glass px-4 py-2"
                  >
                    <span className="text-sm font-semibold text-slate-200">{co.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${co.cls}`}>
                      {co.band} · {co.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
            {/* macOS-style titlebar */}
            <div className="flex items-center gap-1.5 bg-white/[0.04] px-4 py-3 border-b border-white/[0.06]">
              <span className="h-3 w-3 rounded-full bg-red-500/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
              <span className="ml-3 text-xs text-slate-500 font-mono">intentiq — api</span>
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
              <div className={`flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl glass border-white/[0.1] relative overflow-hidden`}>
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
                  className={c.you ? "bg-indigo-500/10" : "hover:bg-white/[0.02] transition-colors"}
                >
                  <td className="px-5 py-4 font-medium">
                    {c.you ? (
                      <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                        {c.name}
                        <span className="inline-flex items-center rounded-full bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 tracking-wide">
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
                  ? "border-indigo-500/40 glow-indigo"
                  : "border-white/[0.08]"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-slate-200">{p.plan}</p>
                  {p.highlight && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
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
                    ? "bg-indigo-500 hover:bg-indigo-400 text-white border-0"
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
          <span className="font-black text-gradient">IntentIQ</span>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} IntentIQ · Built for B2B sales teams
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link href="/login" className="hover:text-slate-200 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-slate-200 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
