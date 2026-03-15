import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import QuickScore from "@/components/dashboard/quick-score";

export default async function DashboardPage() {
  const { userId } = await auth();
  const admin = createSupabaseAdmin();

  const [
    { data: profile },
    { data: recentScores },
    { data: hotLeads },
    { count: totalScores },
  ] = await Promise.all([
    admin.from("users").select("credits_remaining, plan").eq("id", userId!).single(),
    admin.from("scores").select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(10),
    admin.from("watchlist").select("*").eq("user_id", userId!).eq("is_active", true).gte("score", 75).order("score", { ascending: false }),
    admin.from("scores").select("*", { count: "exact", head: true }).eq("user_id", userId!),
  ]);

  const isNewUser = !recentScores || recentScores.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase">[DASHBOARD]</span>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">Overview</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">Welcome back. Here&apos;s your lead intelligence overview.</p>
      </div>

      {/* Onboarding — shown only when user has never scored */}
      {isNewUser && (
        <div className="border border-cyan-500/20 bg-cyan-500/5 p-6 flex items-start gap-5">
          <div className="h-10 w-10 bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-100 mb-1">Welcome to IntentIQ</p>
            <p className="text-sm text-slate-400 mb-4">
              Score your first company to see purchase intent signals, AI analysis, and sales actions — all in one view.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button asChild size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-white border-0 cursor-pointer">
                <Link href="/score">Score a Company</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-white/[0.12] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] cursor-pointer">
                <Link href="/api-keys">Get API Key</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Score — primary action, always first */}
      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-slate-100">Quick Score</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickScore />
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        {(() => {
          const credits = profile?.credits_remaining ?? 0;
          const lowCredits = credits < 5;
          return (
            <Card className={`overflow-hidden ${lowCredits ? "border-amber-500/30" : "border-white/[0.08]"}`}>
              <div className={`h-px bg-gradient-to-r ${lowCredits ? "from-amber-500 via-orange-400 to-transparent" : "from-cyan-500 via-sky-400 to-transparent"}`} />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  Credits Remaining
                  {lowCredits && <span className="text-[10px] font-bold uppercase tracking-wide text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5">Low</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${lowCredits ? "text-amber-400" : "text-slate-100"}`}>{credits}</div>
                <p className="text-xs text-slate-500 capitalize mt-0.5">{profile?.plan ?? "free"} plan</p>
              </CardContent>
            </Card>
          );
        })()}

        {(() => {
          const count = hotLeads?.length ?? 0;
          return (
            <Card className={`overflow-hidden ${count > 0 ? "border-emerald-500/30 animate-score-hot" : "border-white/[0.08]"}`}>
              <div className="h-px bg-gradient-to-r from-emerald-500 via-green-400 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">HOT Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`font-bold text-emerald-400 ${count > 0 ? "text-3xl" : "text-2xl"}`}>{count}</div>
                <p className="text-xs text-slate-500 mt-0.5">Score 75+ in watchlist</p>
              </CardContent>
            </Card>
          );
        })()}

        <Card className="border-white/[0.08] overflow-hidden">
          <div className="h-px bg-gradient-to-r from-blue-400 via-cyan-400 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Scores Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{totalScores ?? 0}</div>
            <p className="text-xs text-slate-500 mt-0.5">Total scored companies</p>
          </CardContent>
        </Card>
      </div>

      {/* HOT Leads Banner */}
      {(hotLeads?.length ?? 0) > 0 && (
        <Card className="border-emerald-500/25 glow-emerald overflow-hidden">
          <div className="h-px bg-gradient-to-r from-emerald-500 via-green-400 to-transparent" />
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-emerald-400 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                HOT Leads — Act Now
              </CardTitle>
              <Link
                href="/pipeline"
                className="text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors whitespace-nowrap"
              >
                View Pipeline →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hotLeads!.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between border border-white/[0.06] px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-slate-200">{lead.company_name}</p>
                    <p className="text-sm text-slate-500">{lead.domain}</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {lead.score}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scores */}
      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-slate-100">Recent Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {isNewUser ? (
            <p className="text-sm text-slate-500">No scores yet. Run your first score above.</p>
          ) : (
            <div className="space-y-2">
              {recentScores!.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between border border-white/[0.06] px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-slate-200">{s.company_name}</p>
                    <p className="text-xs text-slate-500">{s.domain}</p>
                  </div>
                  <Badge className={
                    s.score_band === "HOT"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : s.score_band === "WARM"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                  }>
                    {s.score_band} · {s.score}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
