import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { scoreCompany, domainToCompanyName } from "@/lib/score-service";

const MAX_ROWS = 50;

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse CSV ─────────────────────────────────────────────────────────────
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "CSV file required (field: file)" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in CSV" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ROWS} companies per batch. Your file has ${rows.length} rows.` },
      { status: 400 }
    );
  }

  // Check that CSV has a domain or company column
  const sampleRow = rows[0];
  if (!sampleRow.domain && !sampleRow.company) {
    return NextResponse.json(
      { error: "CSV must have a 'domain' or 'company' column" },
      { status: 400 }
    );
  }

  // ── Credit check ──────────────────────────────────────────────────────────
  const skipCredits = process.env.DISABLE_CREDIT_CHECK === "true";
  const supabase = createSupabaseAdmin();

  let businessProfile: import("@/lib/types").BusinessProfile | null = null;

  if (!skipCredits) {
    const { data: user } = await supabase
      .from("users")
      .select("credits_remaining, product_category, business_profile")
      .eq("id", userId)
      .single();

    if (!user || user.credits_remaining < rows.length) {
      return NextResponse.json(
        { error: `Not enough credits. Need ${rows.length}, have ${user?.credits_remaining ?? 0}.` },
        { status: 402 }
      );
    }
    businessProfile = (user.business_profile as import("@/lib/types").BusinessProfile) ?? null;
  } else {
    const { data: user } = await supabase
      .from("users")
      .select("business_profile")
      .eq("id", userId)
      .single();
    businessProfile = (user?.business_profile as import("@/lib/types").BusinessProfile) ?? null;
  }

  // ── Score each company sequentially ────────────────────────────────────────
  const results: Array<{
    domain: string;
    company_name: string;
    intent_score: number;
    score_band: string;
    ai_summary: string;
    recommended_action: string;
  }> = [];

  const errors: Array<{ domain: string; error: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawDomain = (row.domain ?? "").trim();
    const rawCompany = (row.company ?? "").trim();
    const domain = rawDomain || `${rawCompany.toLowerCase().replace(/\s+/g, "")}.com`;
    const companyName = rawCompany || domainToCompanyName(domain);

    try {
      const result = await scoreCompany({
        domain,
        userId,
        companyName,
        businessProfile,
        skipCredits,
      });

      results.push({
        domain: result.domain ?? domain,
        company_name: result.company ?? companyName,
        intent_score: result.intent_score,
        score_band: result.score_band,
        ai_summary: result.ai_summary ?? "",
        recommended_action: result.recommended_action ?? "",
      });
    } catch (err) {
      console.error(`[bulk-inline] failed to score ${domain}:`, err);
      errors.push({ domain, error: (err as Error).message });
    }

    // Throttle between companies to respect OpenRouter free-tier rate limits (~20 req/min)
    if (i < rows.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.intent_score - a.intent_score);

  return NextResponse.json({
    total: rows.length,
    scored: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// ── CSV parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });
}
