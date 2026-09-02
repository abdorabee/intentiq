import type { ScoreBand } from "@/lib/types";

export const BAND_COLOR: Record<ScoreBand, string> = {
  HOT: "#4ade80",
  WARM: "#f5b544",
  COLD: "#8a8f98",
};

export function bandFromScore(score: number): ScoreBand {
  if (score >= 75) return "HOT";
  if (score >= 50) return "WARM";
  return "COLD";
}
