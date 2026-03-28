import type { PersonIntentScore, PersonSignalSet, ScoreBand, ApolloPersonData } from "@/lib/types";
import { addDays, differenceInDays, parseISO } from "date-fns";

const PERSON_WEIGHTS = {
  career_change: 0.30,
  seniority_fit: 0.20,
  company_intent: 0.20,
  news_mentions: 0.15,
  social_presence: 0.15,
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

export function computePersonIntentScore(
  personData: ApolloPersonData,
  signals: PersonSignalSet
): Omit<PersonIntentScore, "ai_summary" | "recommended_action" | "buying_stage" | "urgency" | "key_triggers" | "why_now" | "approach_angle" | "connection_hooks" | "email_subject" | "talk_track" | "model_tier"> {
  // Weighted sum (0–100)
  const rawScore = (Object.keys(PERSON_WEIGHTS) as Array<keyof typeof PERSON_WEIGHTS>).reduce(
    (acc, key) => {
      const signal = signals[key];
      return acc + (signal.score / signal.max) * 100 * PERSON_WEIGHTS[key];
    },
    0
  );

  // Decay factor: 15% reduction per month without new signal
  const daysSince = getDaysSince(signals.latestSignalDate);
  const decayFactor = Math.pow(0.85, daysSince / 30);
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * decayFactor)));

  const now = new Date();
  const name = personData.name ?? ([personData.first_name, personData.last_name].filter(Boolean).join(" ") || "Unknown");

  return {
    person_name: name,
    person_email: personData.email ?? null,
    person_linkedin: personData.linkedin_url ?? null,
    person_title: personData.title ?? null,
    person_company: personData.organization_name ?? null,
    person_domain: personData.organization?.primary_domain ?? null,
    person_seniority: personData.seniority ?? null,
    intent_score: finalScore,
    score_band: getScoreBand(finalScore),
    last_updated: now.toISOString(),
    signals,
    score_decay_date: addDays(now, 30).toISOString(),
  };
}
