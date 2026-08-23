import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeBusinessProfile } from "@/lib/business-profile";
import { getOnboardingCompletionState } from "@/lib/onboarding-completion";
import { ONBOARDING_VERSION } from "@/lib/onboarding-progress";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { BusinessProfile } from "@/lib/types";

const requestSchema = z.strictObject({
  reason: z.enum(["activation", "skip"]),
});

const USER_COLUMNS = [
  "id",
  "business_profile",
  "onboarding_completed",
  "onboarding_completed_at",
  "onboarding_completed_version",
].join(",");

type ActivationSource = "score" | "watchlist" | "skip" | "existing";

interface CompletionUser {
  id: string;
  business_profile: BusinessProfile | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_completed_version: number;
}

function verifiedUser(value: unknown, userId: string): CompletionUser | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    row.id !== userId ||
    typeof row.onboarding_completed !== "boolean" ||
    (row.onboarding_completed_at !== null && typeof row.onboarding_completed_at !== "string") ||
    typeof row.onboarding_completed_version !== "number"
  ) {
    return null;
  }
  return row as unknown as CompletionUser;
}

function completedResponse(user: CompletionUser, source: ActivationSource) {
  if (getOnboardingCompletionState(user) !== "complete") {
    return null;
  }
  return NextResponse.json({
    completion: {
      onboarding_completed: true,
      onboarding_completed_at: user.onboarding_completed_at,
      onboarding_completed_version: user.onboarding_completed_version,
      activation_source: source,
    },
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid completion reason" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const initial = await admin
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (initial.error) {
    return NextResponse.json({ error: "Failed to verify onboarding" }, { status: 500 });
  }
  const user = verifiedUser(initial.data, userId);
  if (!user) {
    return NextResponse.json(
      { error: initial.data ? "Failed to verify onboarding" : "Profile not found" },
      { status: initial.data ? 500 : 404 },
    );
  }

  const completionState = getOnboardingCompletionState(user);
  if (completionState === "invalid") {
    return NextResponse.json({ error: "Failed to verify onboarding" }, { status: 500 });
  }
  if (completionState === "complete") {
    return completedResponse(user, "existing")
      ?? NextResponse.json({ error: "Failed to verify onboarding" }, { status: 500 });
  }

  if (!normalizeBusinessProfile(user.business_profile)) {
    return NextResponse.json(
      { error: "Complete and save your business profile first", code: "profile_required" },
      { status: 409 },
    );
  }

  let source: ActivationSource = "skip";
  if (parsed.data.reason === "activation") {
    const [scoreResult, watchlistResult] = await Promise.all([
      admin
        .from("scores")
        .select("id,user_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
      admin
        .from("watchlist")
        .select("id,user_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

    if (scoreResult.error || watchlistResult.error) {
      return NextResponse.json({ error: "Failed to verify activation" }, { status: 500 });
    }
    const score = scoreResult.data as Record<string, unknown> | null;
    const watchlist = watchlistResult.data as Record<string, unknown> | null;
    if (
      (score && (typeof score.id !== "string" || score.user_id !== userId)) ||
      (watchlist && (typeof watchlist.id !== "string" || watchlist.user_id !== userId))
    ) {
      return NextResponse.json({ error: "Failed to verify activation" }, { status: 500 });
    }
    if (score) source = "score";
    else if (watchlist) source = "watchlist";
    else {
      return NextResponse.json(
        {
          error: "A persisted score or watchlist account is required",
          code: "activation_required",
        },
        { status: 409 },
      );
    }
  }

  const completedAt = new Date().toISOString();
  const updated = await admin
    .from("users")
    .update({
      onboarding_completed: true,
      onboarding_completed_at: completedAt,
      onboarding_completed_version: ONBOARDING_VERSION,
    })
    .eq("id", userId)
    .eq("onboarding_completed", false)
    .select(USER_COLUMNS)
    .maybeSingle();

  if (updated.error) {
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }

  let completed = verifiedUser(updated.data, userId);
  if (!completed) {
    const raced = await admin
      .from("users")
      .select(USER_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    if (raced.error) {
      return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
    }
    completed = verifiedUser(raced.data, userId);
  }

  if (!completed) {
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
  return completedResponse(completed, source)
    ?? NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
}
