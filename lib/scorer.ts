import type { IntentScore, ScoreBand, SignalSet } from "@/lib/types";
import { addDays, differenceInDays, parseISO } from "date-fns";

const WEIGHTS = {
  funding: 0.25,
  hiring: 0.20,
  news: 0.20,
  technology: 0.20,
  web: 0.15,
} as const;

function getScoreBand(score: number): ScoreBand {
  if (score >= 75) return "HOT";
  if (score >= 50) return "WARM";
  return "COLD";
}

function getDaysSince(isoDate: string): number {
  try {
    return differenceInDays(new Date(), parseISO(isoDate));
  } catch {
    return 0;
  }
}

export function computeIntentScore(
  company: string,
  domain: string,
  signals: SignalSet
): Omit<IntentScore, "ai_summary" | "recommended_action" | "buying_stage" | "urgency" | "key_triggers"> {
  // Weighted sum (0–100)
  const rawScore = (Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>).reduce(
    (acc, key) => {
      const signal = signals[key];
      return acc + (signal.score / signal.max) * 100 * WEIGHTS[key];
    },
    0
  );

  // Decay factor: 15% reduction per month without new signal
  const daysSince = getDaysSince(signals.latestSignalDate);
  const decayFactor = Math.pow(0.85, daysSince / 30);
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * decayFactor)));

  const now = new Date();
  return {
    company,
    domain,
    intent_score: finalScore,
    score_band: getScoreBand(finalScore),
    last_updated: now.toISOString(),
    signals,
    score_decay_date: addDays(now, 30).toISOString(),
  };
}
