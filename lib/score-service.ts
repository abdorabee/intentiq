import { cacheGet, cacheSet, scoreCacheKey, SCORE_TTL_SECONDS } from "@/lib/redis";
import { createSupabaseAdmin } from "@/lib/supabase";
import { fetchFundingSignal } from "@/lib/signals/funding";
import { fetchHiringSignal } from "@/lib/signals/hiring";
import { fetchNewsSignal } from "@/lib/signals/news";
import { fetchTechnologySignal } from "@/lib/signals/technology";
import { fetchWebSignal } from "@/lib/signals/web";
import { fetchGitHubSignal } from "@/lib/signals/github";
import { getMockSignals } from "@/lib/signals/mock";
import { computeIntentScore, generateScoreExplanation, buildScoredSignals } from "@/lib/scorer";
import { generateReasoning } from "@/lib/reasoning";
import { updatePipelineStage } from "@/lib/pipeline";
import type { IntentScore, SignalSet, BusinessProfile } from "@/lib/types";

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
  businessProfile?: BusinessProfile | null;
  skipCredits?: boolean;
}

/**
 * Compute ICP fit score (0–100) by comparing company signals against the user's business profile.
 */
function computeIcpFit(businessProfile: BusinessProfile | null, signals: SignalSet): number {
  if (!businessProfile) return 0;

  let score = 0;

  // Industry alignment (30 pts) — keyword match in signal details
  const industryKeywords = businessProfile.target_industries.map((i) =>
    i.toLowerCase().split("/")[0].split("(")[0].trim()
  );
  const signalText = [signals.news.detail, signals.technology.detail, signals.funding.detail]
    .join(" ")
    .toLowerCase();
  const industryMatches = industryKeywords.filter((kw) => signalText.includes(kw)).length;
  score += industryMatches > 0 ? Math.min(30, 15 + industryMatches * 10) : 10;

  // Company size alignment (25 pts) — inferred from hiring velocity
  const hiringRatio = signals.hiring.score / signals.hiring.max;
  const sizeMap: Record<string, { min: number; max: number }> = {
    "Startups (1-50)": { min: 0, max: 0.3 },
    "SMB (51-200)": { min: 0.2, max: 0.55 },
    "Mid-Market (201-1000)": { min: 0.4, max: 0.75 },
    "Enterprise (1000+)": { min: 0.55, max: 1.0 },
  };
  const sizeRange = sizeMap[businessProfile.company_size];
  score += sizeRange && hiringRatio >= sizeRange.min && hiringRatio <= sizeRange.max ? 25 : 10;

  // Buyer role signal (20 pts) — keywords in hiring detail
  const roleKeywords: Record<string, string[]> = {
    "C-Suite / Founders": ["cto", "ceo", "cfo", "chief", "president", "founder"],
    "VP / Director": ["vp", "vice president", "director", "head of"],
    "Manager / Team Lead": ["manager", "lead", "team lead", "senior"],
    "Individual Contributor": ["engineer", "analyst", "specialist", "developer"],
  };
  const targetKws = roleKeywords[businessProfile.buyer_role] ?? [];
  const hiringText = signals.hiring.detail.toLowerCase();
  score += targetKws.some((kw) => hiringText.includes(kw)) ? 20 : 8;

  // Technology alignment (25 pts) — tech stack score is a proxy for digital maturity
  const techRatio = signals.technology.score / signals.technology.max;
  score += Math.round(techRatio * 25);

  return Math.min(100, Math.round(score));
}

/**
 * Core scoring logic shared between the API route and copilot tools.
 * Handles: signal fetching, score computation, AI reasoning, caching, DB persistence, and credit deduction.
 */
export async function scoreCompany(opts: ScoreCompanyOptions): Promise<IntentScore> {
  const { domain, userId, companyName, productCategory = "B2B SaaS", businessProfile, skipCredits = false } = opts;
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
    const [funding, hiring, news, technology, web, github] = await Promise.all([
      fetchFundingSignal(lookupDomain),
      fetchHiringSignal(lookupDomain),
      fetchNewsSignal(lookupCompany),
      fetchTechnologySignal(lookupDomain),
      fetchWebSignal(lookupDomain),
      fetchGitHubSignal(lookupDomain),
    ]);
    signals = {
      funding,
      hiring,
      news,
      technology,
      web,
      github,
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
    isFirstScore,
    businessProfile
  );

  // ── Score explanation (gpt-4o-mini, cached 24h per domain) ───────────────
  const explanationCacheKey = `score_explanation:${lookupDomain}`;
  let score_explanation = await cacheGet<string>(explanationCacheKey);
  if (!score_explanation) {
    const scoredSignals = buildScoredSignals(signals);
    score_explanation = await generateScoreExplanation(
      lookupCompany,
      partial.intent_score,
      partial.score_band,
      scoredSignals
    );
    if (score_explanation) {
      await cacheSet(explanationCacheKey, score_explanation, SCORE_TTL_SECONDS);
    }
  }

  const icp_fit_score = computeIcpFit(businessProfile ?? null, signals);
  const result: IntentScore = { ...partial, ...reasoning, icp_fit_score, score_explanation: score_explanation ?? "" };

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
