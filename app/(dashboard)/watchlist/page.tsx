import { createSupabaseServerClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function WatchlistPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: watchlist } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", user!.id)
    .eq("is_active", true)
    .order("score", { ascending: false });

  const bandVariant = (band: string) =>
    band === "HOT" ? "default" : band === "WARM" ? "secondary" : "outline";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Watchlist</h1>
        <p className="text-muted-foreground">Companies you&apos;re monitoring — re-scored weekly.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitored Companies ({watchlist?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {(!watchlist || watchlist.length === 0) ? (
            <p className="text-sm text-muted-foreground">
              No companies in your watchlist yet. Add one from the Score Explorer.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Band</TableHead>
                  <TableHead>Last Scored</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchlist.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.company_name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.domain}</TableCell>
                    <TableCell className="font-bold">{item.score ?? "—"}</TableCell>
                    <TableCell>
                      {item.score_band && (
                        <Badge variant={bandVariant(item.score_band)}>{item.score_band}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.last_scored ? new Date(item.last_scored).toLocaleDateString() : "Never"}
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
