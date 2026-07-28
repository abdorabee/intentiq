import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { canonicalizeDomain, InvalidDomainError } from "@/lib/score-service";
import { getActiveScoringVersion } from "@/lib/scorer";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawDomain = searchParams.get("domain")?.trim();

  if (!rawDomain) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const userId = await authenticatedUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let domain: string;
  try {
    domain = canonicalizeDomain(rawDomain);
  } catch (error) {
    if (error instanceof InvalidDomainError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  // Last 90 days of score history for this domain
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data, error } = await supabase
    .from("scores")
    .select("score, score_band, score_status, data_coverage, icp_fit_score, scoring_version, model_fallback, created_at")
    .eq("user_id", userId)
    .eq("domain", domain)
    .eq("scoring_version", getActiveScoringVersion())
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }

  return NextResponse.json({ domain, history: data });
}

async function authenticatedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7).trim();
    if (!apiKey) return null;
    const keyHash = createHash("sha256").update(apiKey).digest("hex");
    const { data } = await createSupabaseAdmin()
      .from("api_keys")
      .select("user_id, is_active")
      .eq("key_hash", keyHash)
      .maybeSingle();
    return data?.is_active ? data.user_id : null;
  }

  return (await auth()).userId;
}
