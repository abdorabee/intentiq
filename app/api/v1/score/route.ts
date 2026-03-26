import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { scoreCompany, domainToCompanyName } from "@/lib/score-service";

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
  let businessProfile: Record<string, unknown> | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    // API key auth
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
  } else {
    // Clerk session auth (dashboard users)
    const { userId: clerkId } = await auth();
    if (clerkId) userId = clerkId;
  }

  // ── Credit check ────────────────────────────────────────────────────────────
  const skipCredits = process.env.DISABLE_CREDIT_CHECK === "true";
  if (userId && !skipCredits) {
    const { data: user } = await supabase
      .from("users")
      .select("credits_remaining, product_category, business_profile")
      .eq("id", userId)
      .single();

    if (!user || user.credits_remaining <= 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }
    productCategory = user.product_category ?? productCategory;
    businessProfile = user.business_profile ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lookupDomain = domain ?? `${company?.toLowerCase().replace(/\s+/g, "")}.com`;
  const lookupCompany = company ?? domainToCompanyName(domain!);

  try {
    const result = await scoreCompany({
      domain: lookupDomain,
      userId,
      companyName: lookupCompany,
      productCategory,
      businessProfile: businessProfile as import("@/lib/types").BusinessProfile | null,
      skipCredits,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[score] error:", err);
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}

async function hashKey(key: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(key).digest("hex");
}
