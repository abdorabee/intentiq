import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PLAN_CREDITS } from "@/lib/types";

const PLANS = [
  { id: "starter", label: "Starter", price: "$49/mo", credits: 500, watchlist: 50 },
  { id: "growth",  label: "Growth",  price: "$149/mo", credits: 2500, watchlist: 250 },
  { id: "pro",     label: "Pro",     price: "$299/mo", credits: 8000, watchlist: 1000 },
  { id: "agency",  label: "Agency",  price: "$499/mo", credits: 25000, watchlist: "Unlimited" },
];

export default async function BillingPage() {
  const { userId } = await auth();
  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("users")
    .select("plan, credits_remaining")
    .eq("id", userId!)
    .single();

  const plan = profile?.plan ?? "free";
  const creditsRemaining = profile?.credits_remaining ?? 0;
  const totalCredits = PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS] ?? 20;
  const usedCredits = totalCredits - creditsRemaining;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase">[BILLING]</span>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">Plans & Credits</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em]">Manage your subscription and credits.</p>
      </div>

      {/* Current Plan */}
      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-slate-100">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="capitalize text-base px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">{plan}</Badge>
            <span className="text-slate-400">{totalCredits} credits/month</span>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1 text-slate-400">
              <span>Credits used this month</span>
              <span className="text-slate-300">{usedCredits} / {totalCredits}</span>
            </div>
            <Progress value={(usedCredits / totalCredits) * 100} className="bg-white/[0.06]" />
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.filter((p) => p.id !== plan).map((p) => (
          <Card key={p.id} className="relative border-white/[0.08] hover:border-white/[0.14] transition-colors">
            <CardHeader>
              <CardTitle className="text-slate-100">{p.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold text-slate-100">{p.price}</p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>{p.credits.toLocaleString()} credits/mo</li>
                <li>{p.watchlist} watchlist companies</li>
                <li>Full API access</li>
              </ul>
              <form action="/api/billing/checkout" method="POST">
                <input type="hidden" name="plan" value={p.id} />
                <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-white border-0 cursor-pointer">Upgrade to {p.label}</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pay-as-you-go top-up */}
      <Card className="border-white/[0.08]">
        <CardHeader><CardTitle className="text-slate-100">Pay-as-you-go Top-up</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-4">$0.08 per credit. No subscription required.</p>
          <form action="/api/billing/topup" method="POST" className="flex gap-2">
            <select name="amount" className="border border-white/[0.08] bg-white/[0.05] text-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50">
              <option value="100" className="bg-[#0d1a2e]">100 credits — $8</option>
              <option value="500" className="bg-[#0d1a2e]">500 credits — $40</option>
              <option value="1000" className="bg-[#0d1a2e]">1,000 credits — $80</option>
            </select>
            <Button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-white border-0 cursor-pointer">Buy Credits</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
