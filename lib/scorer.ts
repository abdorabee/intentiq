import type { IntentScore, ScoreBand, SignalSet } from "@/lib/types";
import { addDays, differenceInDays, parseISO } from "date-fns";

// ── Signal weights (unchanged) ────────────────────────────────────────────────

const WEIGHTS = {
  funding:    0.25,
  hiring:     0.20,
  news:       0.20,
  technology: 0.20,
  web:        0.15,
} as const;

type SignalKey = keyof typeof WEIGHTS;
const SIGNAL_KEYS = Object.keys(WEIGHTS) as SignalKey[];

// ── Internal types ────────────────────────────────────────────────────────────

export interface ScoredSignal {
  type: SignalKey;
  rawScore: number;      // 0-100, after role multiplier (before decay)
  decayedScore: number;  // rawScore × freshness multiplier
  freshness: number;     // 0-1, exponential decay factor
  daysAgo: number;       // days since latestSignalDate
  summary: string;       // signal detail string
}

// ── Band thresholds (unchanged) ───────────────────────────────────────────────

function getScoreBand(score: number): ScoreBand {
  if (score >= 75) return "HOT";
  if (score >= 50) return "WARM";
  return "COLD";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysSince(isoDate: string): number {
  try {
    return Math.max(0, differenceInDays(new Date(), parseISO(isoDate)));
  } catch {
    return 0;
  }
}

/**
 * PROBLEM 1 — Per-signal exponential freshness decay.
 * freshness = e^(-0.023 * days)
 *   7d  → ~0.85   30d → ~0.50   60d → ~0.25   90d → ~0.12
 *
 * Note: All signals share latestSignalDate since individual timestamps are not
 * tracked in SignalResult. This applies uniform decay to the whole set.
 */
function computeFreshness(daysAgo: number): number {
  return Math.exp(-0.023 * daysAgo);
}

/**
 * PROBLEM 3 (hiring) — Role-seniority multiplier for the hiring signal.
 * C-suite / Head of / Director → 1.4×
 * Senior / Lead / Manager      → 1.1×
 * All others                   → 1.0×
 */
function getHiringRoleMultiplier(detail: string): number {
  const lower = detail.toLowerCase();
  if (/\b(vp|head of|director|chief|cro|cmo|cso|president|founder)\b/.test(lower)) return 1.4;
  if (/\b(senior|lead|manager)\b/.test(lower)) return 1.1;
  return 1.0;
}

/**
 * PROBLEM 2 — Sigmoid spread to push weak scores below 35 and strong scores above 70.
 * sigmoid(raw) = 100 / (1 + e^(-0.08 × (raw − 50)))
 * spread       = (sigmoid − 50) × 1.6 + 50
 * clamped 0–100
 */
function applySpread(rawScore: number): number {
  const sigmoid = 100 / (1 + Math.exp(-0.08 * (rawScore - 50)));
  const spread = (sigmoid - 50) * 1.6 + 50;
  return Math.max(0, Math.min(100, Math.round(spread)));
}

// ── Core scorer ───────────────────────────────────────────────────────────────

export function computeIntentScore(
  company: string,
  domain: string,
  signals: SignalSet
): Omit<IntentScore, "ai_summary" | "recommended_action" | "buying_stage" | "urgency" | "key_triggers" | "why_now" | "email_subject" | "talk_track" | "model_tier"> {

  const daysAgo = getDaysSince(signals.latestSignalDate);
  const freshness = computeFreshness(daysAgo);

  // ── Build per-signal scored array ─────────────────────────────────────────

  const scoredSignals: ScoredSignal[] = SIGNAL_KEYS.map((key) => {
    const sig = signals[key];

    // Normalize to 0-100 percent of max
    const pctScore = (sig.score / sig.max) * 100;

    // Apply hiring role multiplier (other signals get 1.0×)
    const roleMultiplier = key === "hiring" ? getHiringRoleMultiplier(sig.detail) : 1.0;
    const rawScore = Math.min(100, pctScore * roleMultiplier);

    // PROBLEM 1: per-signal exponential decay
    const decayedScore = rawScore * freshness;

    return { type: key, rawScore, decayedScore, freshness, daysAgo, summary: sig.detail };
  });

  // ── Weighted decayed sum ──────────────────────────────────────────────────

  const weightedDecayed = scoredSignals.reduce(
    (acc, s) => acc + s.decayedScore * WEIGHTS[s.type],
    0
  );

  // ── PROBLEM 3: Combination multiplier ────────────────────────────────────
  // "Active" = has a non-zero raw score AND signal date is within 30 days.
  // Since all signals share one timestamp, the date check applies uniformly;
  // the rawScore > 0 gate ensures only firing signals count.

  const activeSignalCount = scoredSignals.filter(
    (s) => s.rawScore > 0 && s.daysAgo <= 30
  ).length;

  const combinationMultiplier =
    activeSignalCount >= 4 ? 1.5  :
    activeSignalCount === 3 ? 1.35 :
    activeSignalCount === 2 ? 1.2  :
    1.0;

  const combinedScore = Math.min(100, weightedDecayed * combinationMultiplier);

  // ── PROBLEM 2: Sigmoid spread ─────────────────────────────────────────────

  const finalScore = applySpread(combinedScore);

  // ── Confidence ────────────────────────────────────────────────────────────
  // confidence = (activeSignalCount / totalSignals) × avgFreshness
  const avgFreshness =
    scoredSignals.reduce((a, s) => a + s.freshness, 0) / scoredSignals.length;
  const confidence =
    Math.round((activeSignalCount / SIGNAL_KEYS.length) * avgFreshness * 100) / 100;

  const now = new Date();
  return {
    company,
    domain,
    intent_score: finalScore,
    score_band: getScoreBand(finalScore),
    last_updated: now.toISOString(),
    signals,
    score_decay_date: addDays(now, 30).toISOString(),
    raw_score: Math.round(combinedScore),
    confidence,
  };
}

// ── PROBLEM 4: Score explanation via gpt-4o-mini (OpenRouter) ────────────────

const EXPLANATION_MODEL = "openai/gpt-4o-mini";

function buildExplanationPrompt(
  companyName: string,
  finalScore: number,
  band: ScoreBand,
  scoredSignals: ScoredSignal[]
): string {
  const signalLines = scoredSignals
    .map(
      (s) =>
        `- ${s.type}: ${s.summary} (detected ${s.daysAgo} days ago, freshness ${Math.round(s.freshness * 100)}%)`
    )
    .join("\n");

  return `You are a B2B sales intelligence assistant. A company called "${companyName}" has been scored ${finalScore}/100 (${band}) based on the following signals detected in the last 60 days:

${signalLines}

Write exactly 2 sentences:
1. The most significant reason this company scored ${finalScore}.
2. What a sales rep should do next given this score.
Keep it direct, specific, and under 40 words total. No filler phrases.`;
}

/**
 * Generates a short 2-sentence explanation for the score.
 * Uses gpt-4o-mini via OpenRouter. Non-blocking — returns "" on any failure.
 * Controlled by SCORING_EXPLANATION_ENABLED env flag (default: true).
 */
export async function generateScoreExplanation(
  companyName: string,
  finalScore: number,
  band: ScoreBand,
  scoredSignals: ScoredSignal[]
): Promise<string> {
  const enabled = process.env.SCORING_EXPLANATION_ENABLED !== "false";
  if (!enabled) return "";

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EXPLANATION_MODEL,
        max_tokens: 80,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: buildExplanationPrompt(companyName, finalScore, band, scoredSignals),
          },
        ],
      }),
    });

    if (!res.ok) return "";
    const data = await res.json();
    return (data.choices?.[0]?.message?.content as string | undefined)?.trim() ?? "";
  } catch {
    return "";
  }
}

/**
 * Exported helper so score-service.ts can build ScoredSignals for caching.
 * Mirrors the internal logic of computeIntentScore but returns the scored array.
 */
export function buildScoredSignals(signals: SignalSet): ScoredSignal[] {
  const daysAgo = getDaysSince(signals.latestSignalDate);
  const freshness = computeFreshness(daysAgo);

  return SIGNAL_KEYS.map((key) => {
    const sig = signals[key];
    const pctScore = (sig.score / sig.max) * 100;
    const roleMultiplier = key === "hiring" ? getHiringRoleMultiplier(sig.detail) : 1.0;
    const rawScore = Math.min(100, pctScore * roleMultiplier);
    return { type: key, rawScore, decayedScore: rawScore * freshness, freshness, daysAgo, summary: sig.detail };
  });
}
