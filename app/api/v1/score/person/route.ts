import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { scorePerson } from "@/lib/person-score-service";
import type { BusinessProfile } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim();
  const linkedin = searchParams.get("linkedin")?.trim();
  const name = searchParams.get("name")?.trim();
  const company = searchParams.get("company")?.trim();
  const title = searchParams.get("title")?.trim();

  if (!email && !linkedin && !(name && company)) {
    return NextResponse.json(
      { error: "Provide at least one of: email, linkedin, or name + company" },
      { status: 400 }
    );
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const supabase = createSupabaseAdmin();
  let userId: string | null = null;
  let productCategory = "B2B SaaS";
  let businessProfile: BusinessProfile | null = null;

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
  } else {
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
    businessProfile = (user.business_profile as BusinessProfile) ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await scorePerson({
      email: email || undefined,
      linkedinUrl: linkedin || undefined,
      name: name || undefined,
      organizationName: company || undefined,
      title: title || undefined,
      userId,
      productCategory,
      businessProfile,
      skipCredits,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[person-score] error:", err);
    const message = (err as Error).message ?? "Person scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function hashKey(key: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(key).digest("hex");
}
