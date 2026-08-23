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
  "onboarding_revision",
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
  const result = await admin.rpc("save_onboarding_progress", {
    p_user_id: userId,
    p_step: parsed.data.step,
    p_draft: parsed.data.draft,
    p_version: ONBOARDING_VERSION,
    p_revision: parsed.data.revision,
  });

  if (result.error || !Array.isArray(result.data)) {
    return NextResponse.json({ error: "Failed to save onboarding progress" }, { status: 500 });
  }

  if (result.data.length === 0) {
    const current = await admin
      .from("user_preferences")
      .select(PROGRESS_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
    const authoritative = onboardingProgressRowSchema.safeParse(current.data);
    if (
      current.error ||
      !authoritative.success ||
      authoritative.data.user_id !== userId ||
      authoritative.data.onboarding_revision < parsed.data.revision
    ) {
      return NextResponse.json({ error: "Failed to save onboarding progress" }, { status: 500 });
    }
    return NextResponse.json(
      {
        error: "A newer onboarding draft is already saved",
        code: "stale_revision",
        progress: publicOnboardingProgress(authoritative.data),
      },
      { status: 409 },
    );
  }
  if (result.data.length !== 1) {
    return NextResponse.json({ error: "Failed to save onboarding progress" }, { status: 500 });
  }

  const verified = onboardingProgressRowSchema.safeParse(result.data[0]);
  if (!verified.success || verified.data.user_id !== userId) {
    return NextResponse.json({ error: "Failed to save onboarding progress" }, { status: 500 });
  }

  return NextResponse.json({ progress: publicOnboardingProgress(verified.data) });
}
