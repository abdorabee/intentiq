import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  ONBOARDING_VERSION,
  onboardingProgressRequestSchema,
  onboardingProgressRowSchema,
  publicOnboardingProgress,
} from "@/lib/onboarding-progress";
import { createSupabaseAdmin } from "@/lib/supabase";

const PROGRESS_COLUMNS = [
  "user_id",
  "onboarding_step",
  "onboarding_draft",
  "onboarding_version",
  "updated_at",
].join(",");

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = onboardingProgressRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid onboarding progress",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdmin();
  const result = await admin
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        onboarding_step: parsed.data.step,
        onboarding_draft: parsed.data.draft,
        onboarding_version: ONBOARDING_VERSION,
      },
      { onConflict: "user_id" },
    )
    .select(PROGRESS_COLUMNS)
    .eq("user_id", userId)
    .single();

  if (result.error || !result.data) {
    return NextResponse.json({ error: "Failed to save onboarding progress" }, { status: 500 });
  }

  const verified = onboardingProgressRowSchema.safeParse(result.data);
  if (!verified.success || verified.data.user_id !== userId) {
    return NextResponse.json({ error: "Failed to save onboarding progress" }, { status: 500 });
  }

  return NextResponse.json({ progress: publicOnboardingProgress(verified.data) });
}
