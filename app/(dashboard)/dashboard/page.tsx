import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuickScore from "@/components/dashboard/quick-score";

export default async function DashboardPage() {
  const { userId } = await auth();
  const admin = createSupabaseAdmin();

  const [{ data: profile }, { data: recentScores }, { data: hotLeads }] = await Promise.all([
    admin.from("users").select("credits_remaining, plan").eq("id", userId!).single(),
    admin.from("scores").select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(10),
    admin.from("watchlist").select("*").eq("user_id", userId!).eq("is_active", true).gte("score", 75).order("score", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here&apos;s your lead intelligence overview.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-subtle shadow-none overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credits Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.credits_remaining ?? 0}</div>
            <p className="text-xs text-muted-foreground capitalize">{profile?.plan ?? "free"} plan</p>
          </CardContent>
        </Card>

        <Card className="border-subtle shadow-none overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">HOT Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{hotLeads?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Score 75+ in watchlist</p>
          </CardContent>
        </Card>

        <Card className="border-subtle shadow-none overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scores Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentScores?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Last 10 shown</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Score */}
      <Card className="border-subtle shadow-none">
        <CardHeader>
          <CardTitle>Quick Score</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickScore />
        </CardContent>
      </Card>

      {/* HOT Leads Banner */}
      {(hotLeads?.length ?? 0) > 0 && (
        <Card className="border-green-400 shadow-none bg-green-50/30">
          <CardHeader>
            <CardTitle className="text-green-600">HOT Leads — Act Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hotLeads!.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-full border border-subtle px-4 py-2.5 bg-white">
                  <div>
                    <p className="font-medium">{lead.company_name}</p>
                    <p className="text-sm text-muted-foreground">{lead.domain}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full">{lead.score}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scores */}
      <Card className="border-subtle shadow-none">
        <CardHeader>
          <CardTitle>Recent Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {(!recentScores || recentScores.length === 0) ? (
            <p className="text-sm text-muted-foreground">No scores yet. Run your first score above.</p>
          ) : (
            <div className="space-y-2">
              {recentScores.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-full border border-subtle px-4 py-2.5 bg-white">
                  <div>
                    <p className="font-medium">{s.company_name}</p>
                    <p className="text-xs text-muted-foreground">{s.domain}</p>
                  </div>
                  <Badge className={
                    s.score_band === "HOT"  ? "bg-green-100 text-green-700 border-green-200 rounded-full" :
                    s.score_band === "WARM" ? "bg-amber-100 text-amber-700 border-amber-200 rounded-full" :
                                              "bg-gray-100 text-gray-600 border-gray-200 rounded-full"
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
