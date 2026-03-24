import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PLAN_CREDITS } from "@/lib/types";
import { Clock, Sparkles } from "lucide-react";

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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">Plans & Credits</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em]">Manage your subscription and credits.</p>
      </div>

      {/* Current Plan */}
      <Card className="border-slate-200 dark:border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-100">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="capitalize text-base px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">{plan}</Badge>
            <span className="text-slate-500 dark:text-slate-400">{totalCredits} credits/month</span>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1 text-slate-500 dark:text-slate-400">
              <span>Credits used this month</span>
              <span className="text-slate-600 dark:text-slate-300">{usedCredits} / {totalCredits}</span>
            </div>
            <Progress value={(usedCredits / totalCredits) * 100} className="bg-slate-100 dark:bg-white/[0.06]" />
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card className="border-slate-200 dark:border-white/[0.08] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        <CardContent className="relative py-12 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Paid Plans Coming Soon</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-md">
              We&apos;re finalizing our pricing plans. During the beta, enjoy free access to IntentIQ&apos;s full scoring engine.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Subscriptions & top-ups will be available here once we launch</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
