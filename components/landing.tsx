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
  { name: "Stripe",     score: 91, band: "HOT",  cls: "bg-green-100 text-green-700" },
  { name: "Notion",     score: 78, band: "HOT",  cls: "bg-green-100 text-green-700" },
  { name: "Linear",     score: 82, band: "HOT",  cls: "bg-green-100 text-green-700" },
  { name: "Vercel",     score: 67, band: "WARM", cls: "bg-amber-100 text-amber-700" },
  { name: "Figma",      score: 71, band: "WARM", cls: "bg-amber-100 text-amber-700" },
  { name: "Loom",       score: 44, band: "COLD", cls: "bg-gray-100 text-gray-600"   },
  { name: "Intercom",   score: 88, band: "HOT",  cls: "bg-green-100 text-green-700" },
  { name: "Hubspot",    score: 55, band: "WARM", cls: "bg-amber-100 text-amber-700" },
  { name: "Salesforce", score: 93, band: "HOT",  cls: "bg-green-100 text-green-700" },
  { name: "Mixpanel",   score: 38, band: "COLD", cls: "bg-gray-100 text-gray-600"   },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit a domain",
    body: "Pass any company domain via our REST API or the dashboard UI. No CRM integration required.",
  },
  {
    step: "02",
    title: "5 live signals fetched in parallel",
    body: "Funding rounds, hiring velocity, news triggers, tech stack, and web presence — all fetched simultaneously.",
  },
  {
    step: "03",
    title: "Weighted intent score computed",
    body: "A composite 0–100 score with configurable signal weights. HOT ≥75, WARM ≥50, COLD <50.",
  },
  {
    step: "04",
    title: "AI reasoning + recommended action",
    body: "Claude generates a plain-English summary, a 'why now' insight, and a specific outreach action to take.",
  },
];


function Check({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
      <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100">
      <svg className="h-3 w-3 text-zinc-400" viewBox="0 0 12 12" fill="none">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/80 border-b border-subtle">
        <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
          IntentIQ
        </span>
        <div className="hidden md:flex items-center gap-1">
          <Link href="/docs" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
          <a href="#demo" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            API
          </a>
          <a href="#pricing" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden max-w-5xl mx-auto px-6 pt-28 pb-16 text-center">
        {/* Gradient wash blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-start justify-center"
        >
          <div className="h-[520px] w-[900px] rounded-full bg-gradient-to-br from-indigo-100/60 via-violet-100/40 to-blue-100/50 blur-3xl -translate-y-1/4" />
        </div>

        <div className="relative space-y-7">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-white/80 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Now in beta — 20 free credits, no card required
          </div>

          {/* Headline with CSS word rotation */}
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Score{" "}
            <span className="relative inline-block text-indigo-600">
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
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One API call. Any company. A composite intent score (0–100) with AI reasoning
            and a specific action — in under 3 seconds. No setup. No contract. From $49/mo.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-8"
              asChild
            >
              <Link href="/signup">Start free — 20 credits</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-subtle px-8"
              asChild
            >
              <Link href="#demo">See live demo</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            6sense charges $50,000+/year for the same output. You pay $49/month.
          </p>

          {/* Scrolling marquee of scored companies */}
          <div className="relative mt-10 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-background to-transparent" />
            <div className="flex overflow-hidden">
              <div className="animate-marquee flex gap-4">
                {[...MARQUEE_COMPANIES, ...MARQUEE_COMPANIES].map((co, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 flex items-center gap-3 rounded-full border border-subtle bg-white px-4 py-2 shadow-sm"
                  >
                    <span className="text-sm font-semibold">{co.name}</span>
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
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">One API call.</h2>
            <p className="text-muted-foreground">Works with curl, JavaScript, Python — or any HTTP client.</p>
          </div>
          <div className="rounded-2xl border border-subtle overflow-hidden shadow-sm">
            {/* macOS-style titlebar */}
            <div className="flex items-center gap-1.5 bg-zinc-900 px-4 py-3 border-b border-white/10">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-zinc-400 font-mono">intentiq — api</span>
            </div>
            <pre className="bg-zinc-900 text-green-400 p-6 text-sm overflow-x-auto leading-relaxed">
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
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">How it works</h2>
          <p className="text-muted-foreground">From domain to deal signal in under 3 seconds.</p>
        </div>
        <div className="space-y-12">
          {HOW_IT_WORKS.map((item, idx) => (
            <div
              key={item.step}
              className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 1 ? "md:flex-row-reverse" : ""}`}
            >
              <div className="flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-subtle">
                <span className="text-2xl font-black text-indigo-600">{item.step}</span>
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-4xl mx-auto px-6 py-24 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">How we compare</h2>
          <p className="text-muted-foreground">Honest side-by-side. No asterisks.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-subtle overflow-hidden">
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="border-b border-subtle bg-zinc-50">
                {["Product", "Price", "SMB-Friendly", "API-First", "AI Reasoning", "MENA Coverage"].map((h) => (
                  <th key={h} className="px-5 py-4 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.04]">
              {COMPARISON.map((c) => (
                <tr
                  key={c.name}
                  className={c.you ? "bg-indigo-50/60" : "hover:bg-zinc-50/60 transition-colors"}
                >
                  <td className="px-5 py-4 font-medium">
                    {c.you
                      ? <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                          {c.name}
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 tracking-wide">YOU</span>
                        </span>
                      : c.name}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground font-mono text-xs">{c.price}</td>
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
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Simple pricing</h2>
          <p className="text-muted-foreground">Pay for what you score. No annual lock-in.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {PRICING.map((p) => (
            <div
              key={p.plan}
              className={`flex flex-col rounded-2xl border bg-white p-5 gap-4 ${
                p.highlight
                  ? "border-indigo-400 ring-2 ring-indigo-200"
                  : "border-subtle"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{p.plan}</p>
                  {p.highlight && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black">
                  {p.price}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{p.credits} credits</p>
              <Button
                className={`w-full rounded-full mt-auto ${
                  p.highlight ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
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
        <p className="text-center text-sm text-muted-foreground">
          Pay-as-you-go also available at $0.08/credit. No annual contracts.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-subtle py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="font-black bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            IntentIQ
          </span>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} IntentIQ · Built for B2B sales teams
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
