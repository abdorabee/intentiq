import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { profileUpdateSchema } from "@/lib/business-profile";
import { createSupabaseAdmin } from "@/lib/supabase";
import { parseProfilePatch } from "@/lib/user-role";
import type { UserRole } from "@/lib/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("business_profile, onboarding_completed, product_category, role")
    .eq("id", userId)
    .single();

  if (error) return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });

  return NextResponse.json({
    business_profile: data?.business_profile ?? null,
    onboarding_completed: data?.onboarding_completed ?? false,
    role: (data?.role as UserRole | undefined) ?? "sdr",
  });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const hasProfile = typeof body === "object" && body !== null && "business_profile" in body;
    return NextResponse.json(
      {
        error: hasProfile ? "Invalid business_profile" : "business_profile is required",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }
  const profile = parsed.data.business_profile;
  const onboardingCompleted = parsed.data.onboarding_completed;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({
      business_profile: profile,
      product_category: profile.product_category,
      onboarding_completed: onboardingCompleted,
    })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = parseProfilePatch(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid profile update",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });

  return NextResponse.json({ success: true, ...parsed.data });
}
