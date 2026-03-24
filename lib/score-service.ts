import { cacheGet, cacheSet, scoreCacheKey, SCORE_TTL_SECONDS } from "@/lib/redis";
import { createSupabaseAdmin } from "@/lib/supabase";
import { fetchFundingSignal } from "@/lib/signals/funding";
import { fetchHiringSignal } from "@/lib/signals/hiring";
import { fetchNewsSignal } from "@/lib/signals/news";
import { fetchTechnologySignal } from "@/lib/signals/technology";
import { fetchWebSignal } from "@/lib/signals/web";
import { getMockSignals } from "@/lib/signals/mock";
import { computeIntentScore } from "@/lib/scorer";
import { generateReasoning } from "@/lib/reasoning";
import { updatePipelineStage } from "@/lib/pipeline";
import type { IntentScore, SignalSet } from "@/lib/types";

const USE_MOCK = process.env.MOCK_SIGNALS === "true";

// "stripe.com" → "Stripe", "linear.app" → "Linear"
export function domainToCompanyName(domain: string): string {
  const hostname = domain.replace(/^https?:\/\//, "").split("/")[0];
  const parts = hostname.split(".");
  const name = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export interface ScoreCompanyOptions {
  domain: string;
  userId: string;
  companyName?: string;
  productCategory?: string;
  skipCredits?: boolean;
}

/**
 * Core scoring logic shared between the API route and copilot tools.
 * Handles: signal fetching, score computation, AI reasoning, caching, DB persistence, and credit deduction.
 */
export async function scoreCompany(opts: ScoreCompanyOptions): Promise<IntentScore> {
  const { domain, userId, companyName, productCategory = "B2B SaaS", skipCredits = false } = opts;
  const supabase = createSupabaseAdmin();

  const lookupDomain = domain.toLowerCase().trim();
  const lookupCompany = companyName ?? domainToCompanyName(lookupDomain);

  // ── Cache check ──────────────────────────────────────────────────────────
  const cacheKey = scoreCacheKey(lookupDomain);
  const cached = await cacheGet<IntentScore>(cacheKey);
  if (cached) return cached;

  // ── Fetch signals ────────────────────────────────────────────────────────
  let signals: SignalSet;
  if (USE_MOCK) {
    signals = getMockSignals(lookupDomain);
  } else {
    const [funding, hiring, news, technology, web] = await Promise.all([
      fetchFundingSignal(lookupDomain),
      fetchHiringSignal(lookupDomain),
      fetchNewsSignal(lookupCompany),
      fetchTechnologySignal(lookupDomain),
      fetchWebSignal(lookupDomain),
    ]);
    signals = {
      funding,
      hiring,
      news,
      technology,
      web,
      latestSignalDate: new Date().toISOString(),
    };
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  const partial = computeIntentScore(lookupCompany, lookupDomain, signals);

  // ── Detect first vs re-score ─────────────────────────────────────────────
  const { data: existingScore } = await supabase
    .from("scores")
    .select("id")
    .eq("domain", lookupDomain)
    .limit(1)
    .maybeSingle();
  const isFirstScore = !existingScore;

  // ── AI Reasoning ─────────────────────────────────────────────────────────
  const reasoning = await generateReasoning(
    lookupCompany,
    partial.intent_score,
    partial.score_band,
    signals,
    productCategory,
    isFirstScore
  );

  const result: IntentScore = { ...partial, ...reasoning };

  // ── Cache + persist ──────────────────────────────────────────────────────
  await cacheSet(cacheKey, result, SCORE_TTL_SECONDS);

  const { error: insertError } = await supabase.from("scores").insert({
    user_id: userId,
    domain: lookupDomain,
    company_name: lookupCompany,
    score: result.intent_score,
    score_band: result.score_band,
    signals,
    ai_summary: result.ai_summary,
    recommended_action: result.recommended_action,
    buying_stage: result.buying_stage,
    urgency: result.urgency,
    key_triggers: result.key_triggers,
    why_now: result.why_now,
    email_subject: result.email_subject,
    talk_track: result.talk_track,
    expires_at: result.score_decay_date,
  });
  if (insertError) console.error("[score-service] insert error:", insertError);

  if (!skipCredits) {
    const { error: creditError } = await supabase.rpc("deduct_credit", { p_user_id: userId });
    if (creditError) console.error("[score-service] deduct_credit error:", creditError);
  }

  // ── Update pipeline stage if on watchlist ────────────────────────────────
  await updatePipelineStage(userId, lookupDomain, result.intent_score);

  return result;
}
