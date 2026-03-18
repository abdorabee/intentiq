import { createSupabaseAdmin } from "@/lib/supabase";
import type { PipelineStage } from "@/lib/types";

/**
 * Compute the pipeline stage for a company based on its new score.
 * Never auto-downgrades from manual stages (engaged, converted).
 */
export function computeStage(
  currentStage: PipelineStage,
  newScore: number,
  previousScore: number | null
): PipelineStage {
  // Never auto-downgrade from user-confirmed stages
  if (currentStage === "engaged" || currentStage === "converted") {
    return currentStage;
  }

  if (newScore >= 75) return "hot";
  if (newScore >= 50) return "warming";
  if (newScore >= 30 && previousScore !== null && newScore - previousScore >= 10) return "warming";
  return "cold";
}

/**
 * Update pipeline stage for a company if it's on the user's watchlist.
 * Called after every score completion.
 */
export async function updatePipelineStage(
  userId: string,
  domain: string,
  newScore: number
): Promise<void> {
  const supabase = createSupabaseAdmin();

  const { data: entry } = await supabase
    .from("watchlist")
    .select("id, pipeline_stage, previous_score, score")
    .eq("user_id", userId)
    .eq("domain", domain)
    .eq("is_active", true)
    .single();

  if (!entry) return; // Not on watchlist

  const currentStage = (entry.pipeline_stage ?? "cold") as PipelineStage;
  const previousScore = entry.score ?? entry.previous_score ?? null;
  const newStage = computeStage(currentStage, newScore, previousScore);

  const updates: Record<string, unknown> = {
    previous_score: entry.score,
    score: newScore,
    score_band: newScore >= 75 ? "HOT" : newScore >= 50 ? "WARM" : "COLD",
    last_scored: new Date().toISOString(),
  };

  if (newStage !== currentStage) {
    updates.pipeline_stage = newStage;
    updates.stage_changed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("watchlist")
    .update(updates)
    .eq("id", entry.id);

  if (error) console.error("[pipeline] update error:", error);
}
