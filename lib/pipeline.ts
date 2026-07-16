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
  newScore: number,
  options: {
    previousV2Score: number | null;
    allowStageTransition: boolean;
  }
): Promise<void> {
  const supabase = createSupabaseAdmin();

  const { data: entry } = await supabase
    .from("watchlist")
    .select("id, pipeline_stage")
    .eq("user_id", userId)
    .eq("domain", domain)
    .eq("is_active", true)
    .single();

  if (!entry) return; // Not on watchlist

  const currentStage = (entry.pipeline_stage ?? "cold") as PipelineStage;
  const canChangeStage =
    options.allowStageTransition &&
    options.previousV2Score !== null &&
    options.previousV2Score !== newScore;
  const newStage = canChangeStage
    ? computeStage(currentStage, newScore, options.previousV2Score)
    : currentStage;

  const updates: Record<string, unknown> = {
    previous_score: options.previousV2Score,
    score: newScore,
    score_band: newScore >= 75 ? "HOT" : newScore >= 50 ? "WARM" : "COLD",
    last_scored: new Date().toISOString(),
  };

  if (canChangeStage && newStage !== currentStage) {
    updates.pipeline_stage = newStage;
    updates.stage_changed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("watchlist")
    .update(updates)
    .eq("id", entry.id);

  if (error) console.error("[pipeline] update error:", error);
}
