import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRICING = [
  { plan: "Free",    price: "$0",    credits: "20",     cta: "Start Free" },
  { plan: "Starter", price: "$49",   credits: "500",    cta: "Get Started",  highlight: false },
  { plan: "Growth",  price: "$149",  credits: "2,500",  cta: "Get Started",  highlight: true  },
  { plan: "Pro",     price: "$299",  credits: "8,000",  cta: "Get Started",  highlight: false },
  { plan: "Agency",  price: "$499",  credits: "25,000", cta: "Get Started",  highlight: false },
];

const COMPARISON = [
  { name: "6sense",         price: "$50K+/yr", smb: false, api: false, ai: false, mena: false },
  { name: "Bombora",        price: "$25K+/yr", smb: false, api: false, ai: false, mena: false },
  { name: "ZoomInfo Intent",price: "$15K+/yr", smb: false, api: false, ai: false, mena: true  },
  { name: "Apollo Intent",  price: "$49/mo+",  smb: true,  api: true,  ai: false, mena: true  },
  { name: "IntentIQ",       price: "$49/mo",   smb: true,  api: true,  ai: true,  mena: true, you: true },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-xl font-black">IntentIQ</span>
        <div className="flex gap-3">
          <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
          <Button asChild><Link href="/signup">Start free</Link></Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
        <Badge variant="secondary">Now in beta</Badge>
        <h1 className="text-5xl font-black tracking-tight">
          Know which leads are ready to buy —<br />before your competitors do.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          One API call. Any company. A composite intent score (0–100) with AI reasoning
          and a specific action — in under 3 seconds. No setup. No contract. From $49/mo.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" asChild><Link href="/signup">Start free — 20 credits</Link></Button>
          <Button size="lg" variant="outline" asChild><Link href="#demo">See live demo</Link></Button>
        </div>
        <p className="text-sm text-muted-foreground">
          6sense charges $50,000+/year for the same output. You pay $49/month.
        </p>
      </section>

      {/* Code snippet */}
      <section id="demo" className="bg-muted/50 py-16">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl font-bold text-center">One line of code</h2>
          <pre className="rounded-xl bg-zinc-900 text-green-400 p-6 text-sm overflow-x-auto">
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
      </section>

      {/* Comparison */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-6">
        <h2 className="text-3xl font-bold text-center">How we compare</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-muted">
              <tr>
                {["Product", "Price", "SMB-Friendly", "API-First", "AI Reasoning", "MENA Coverage"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((c) => (
                <tr key={c.name} className={c.you ? "bg-primary/5 font-semibold" : ""}>
                  <td className="px-4 py-3">{c.you ? <strong>{c.name}</strong> : c.name}</td>
                  <td className="px-4 py-3">{c.price}</td>
                  <td className="px-4 py-3">{c.smb ? "✅" : "❌"}</td>
                  <td className="px-4 py-3">{c.api ? "✅" : "❌"}</td>
                  <td className="px-4 py-3">{c.ai ? "✅" : "❌"}</td>
                  <td className="px-4 py-3">{c.mena ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <h2 className="text-3xl font-bold text-center">Simple pricing</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {PRICING.map((p) => (
              <Card key={p.plan} className={p.plan === "Growth" ? "border-primary shadow-lg" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.plan}</CardTitle>
                  {p.plan === "Growth" && <Badge>Most Popular</Badge>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">{p.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-sm text-muted-foreground">{p.credits} credits</p>
                  <Button className="w-full" variant={p.plan === "Growth" ? "default" : "outline"} size="sm" asChild>
                    <Link href="/signup">{p.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Pay-as-you-go also available at $0.08/credit. No annual contracts.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} IntentIQ · Built for B2B sales teams
      </footer>
    </div>
  );
}
