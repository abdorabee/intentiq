import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DbScore, ScoreBand, BuyingStage, UrgencyLevel } from "@/lib/types";

const bandVariant = (band: ScoreBand) =>
  band === "HOT" ? "default" : band === "WARM" ? "secondary" : "outline";

const bandColor = (band: ScoreBand) =>
  band === "HOT" ? "text-green-600" : band === "WARM" ? "text-yellow-600" : "text-gray-500";

const urgencyColor = (u: UrgencyLevel | null) => {
  if (u === "act-now") return "bg-red-100 text-red-700";
  if (u === "this-week") return "bg-orange-100 text-orange-700";
  if (u === "this-month") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-600";
};

const stageLabel = (s: BuyingStage | null) => {
  if (s === "decision") return "Decision";
  if (s === "consideration") return "Consideration";
  return "Awareness";
};

export default async function ScoreHistoryPage() {
  const { userId } = await auth();
  const admin = createSupabaseAdmin();

  const { data: scores } = await admin
    .from("scores")
    .select("*")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (scores ?? []) as DbScore[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Score History</h1>
        <p className="text-muted-foreground">All companies you've scored — most recent first.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scores ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scores yet. Use the Score Explorer to score your first company.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Band</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Key Triggers</TableHead>
                  <TableHead>AI Summary</TableHead>
                  <TableHead>Scored</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.company_name}</div>
                      <div className="text-xs text-muted-foreground">{row.domain}</div>
                    </TableCell>

                    <TableCell>
                      <span className={`text-2xl font-black ${bandColor(row.score_band)}`}>
                        {row.score}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={bandVariant(row.score_band)}>{row.score_band}</Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {stageLabel(row.buying_stage)}
                      </span>
                    </TableCell>

                    <TableCell>
                      {row.urgency && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${urgencyColor(row.urgency)}`}>
                          {row.urgency}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {(row.key_triggers ?? []).slice(0, 2).map((t, i) => (
                          <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full truncate max-w-[180px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[260px]">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {row.ai_summary}
                      </p>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(row.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
