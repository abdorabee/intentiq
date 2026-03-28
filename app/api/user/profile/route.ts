import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { BusinessProfile } from "@/lib/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("business_profile, onboarding_completed, product_category")
    .eq("id", userId)
    .single();

  if (error) return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });

  return NextResponse.json({
    business_profile: data?.business_profile ?? null,
    onboarding_completed: data?.onboarding_completed ?? false,
  });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { business_profile: BusinessProfile };
  const profile = body.business_profile;

  if (!profile?.product_category) {
    return NextResponse.json({ error: "business_profile is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({
      business_profile: profile,
      product_category: profile.product_category,
      onboarding_completed: true,
    })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });

  return NextResponse.json({ success: true });
}
