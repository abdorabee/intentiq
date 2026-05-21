import { createSupabaseAdmin } from "@/lib/supabase";
import { ScoreView } from "./score-view";
import type { RecentScore } from "./score-view";

export default async function ScorePage() {
  const supabase = createSupabaseAdmin();
  const { data: { user } } = await supabase.auth.getUser();

  let creditsRemaining = 0;
  let recentScores: RecentScore[] = [];

  if (user) {
    const [userResult, scoresResult] = await Promise.all([
      supabase.from("users").select("credits_remaining").eq("id", user.id).single(),
      supabase
        .from("scores")
        .select("domain, company_name, score, score_band, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    if (userResult.data) creditsRemaining = userResult.data.credits_remaining;
    if (scoresResult.data) recentScores = scoresResult.data as RecentScore[];
  }

  return <ScoreView creditsRemaining={creditsRemaining} recentScores={recentScores} />;
}
