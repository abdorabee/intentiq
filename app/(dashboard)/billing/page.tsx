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
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and credits.</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="capitalize text-base px-3 py-1">{plan}</Badge>
            <span className="text-muted-foreground">{totalCredits} credits/month</span>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Credits used this month</span>
              <span>{usedCredits} / {totalCredits}</span>
            </div>
            <Progress value={(usedCredits / totalCredits) * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.filter((p) => p.id !== plan).map((p) => (
          <Card key={p.id} className="relative">
            <CardHeader>
              <CardTitle>{p.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold">{p.price}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{p.credits.toLocaleString()} credits/mo</li>
                <li>{p.watchlist} watchlist companies</li>
                <li>Full API access</li>
              </ul>
              <form action="/api/billing/checkout" method="POST">
                <input type="hidden" name="plan" value={p.id} />
                <Button type="submit" className="w-full">Upgrade to {p.label}</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pay-as-you-go top-up */}
      <Card>
        <CardHeader><CardTitle>Pay-as-you-go Top-up</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">$0.08 per credit. No subscription required.</p>
          <form action="/api/billing/topup" method="POST" className="flex gap-2">
            <select name="amount" className="rounded-md border px-3 py-2 text-sm">
              <option value="100">100 credits — $8</option>
              <option value="500">500 credits — $40</option>
              <option value="1000">1,000 credits — $80</option>
            </select>
            <Button type="submit">Buy Credits</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
