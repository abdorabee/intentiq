import { NextRequest, NextResponse } from "next/server";
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
import type { IntentScore, SignalSet } from "@/lib/types";

const USE_MOCK = process.env.MOCK_SIGNALS === "true";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain")?.toLowerCase().trim();
  const company = searchParams.get("company")?.trim();

  if (!domain && !company) {
    return NextResponse.json(
      { error: "Provide at least one of: domain, company" },
      { status: 400 }
    );
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const supabase = createSupabaseAdmin();
  let userId: string | null = null;
  let productCategory = "B2B SaaS";

  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7);
    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("user_id, is_active")
      .eq("key_hash", await hashKey(apiKey))
      .single();

    if (!keyRow?.is_active) {
      return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 401 });
    }
    userId = keyRow.user_id;
  }

  // ── Credit check ────────────────────────────────────────────────────────────
  if (userId) {
    const { data: user } = await supabase
      .from("users")
      .select("credits_remaining, product_category")
      .eq("id", userId)
      .single();

    if (!user || user.credits_remaining <= 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }
    productCategory = user.product_category ?? productCategory;
  }

  const lookupDomain = domain ?? `${company?.toLowerCase().replace(/\s+/g, "")}.com`;
  const lookupCompany = company ?? domain!;

  // ── Cache check ──────────────────────────────────────────────────────────────
  const cacheKey = scoreCacheKey(lookupDomain);
  const cached = await cacheGet<IntentScore>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // ── Fetch all signals in parallel (or use mock data in dev) ─────────────────
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

  // ── Score ────────────────────────────────────────────────────────────────────
  const partial = computeIntentScore(lookupCompany, lookupDomain, signals);

  // ── AI Reasoning ─────────────────────────────────────────────────────────────
  const { ai_summary, recommended_action } = await generateReasoning(
    lookupCompany,
    partial.intent_score,
    partial.score_band,
    signals,
    productCategory
  );

  const result: IntentScore = { ...partial, ai_summary, recommended_action };

  // ── Cache + persist ──────────────────────────────────────────────────────────
  await cacheSet(cacheKey, result, SCORE_TTL_SECONDS);

  if (userId) {
    await Promise.all([
      supabase.from("scores").insert({
        user_id: userId,
        domain: lookupDomain,
        company_name: lookupCompany,
        score: result.intent_score,
        score_band: result.score_band,
        signals,
        ai_summary,
        recommended_action,
        expires_at: result.score_decay_date,
      }),
      supabase.rpc("deduct_credit", { p_user_id: userId }),
    ]);
  }

  return NextResponse.json(result);
}

async function hashKey(key: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(key).digest("hex");
}
