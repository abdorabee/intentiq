import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  ACTIVE_PRODUCT_TOUR_VERSION,
  tourMutationRequestSchema,
  tourProgressFromPreferences,
  transitionTour,
} from "@/lib/product-tour";
import { createSupabaseAdmin } from "@/lib/supabase";
import { userPreferencesRowSchema } from "@/lib/user-preferences";
import {
  getOrCreateUserPreferences,
  PREFERENCE_COLUMNS,
} from "@/lib/user-preferences-server";

function tourResponse(preferences: Parameters<typeof tourProgressFromPreferences>[0]) {
  return NextResponse.json({ tour: tourProgressFromPreferences(preferences) });
}

function readTourProgress(preferences: Parameters<typeof tourProgressFromPreferences>[0]) {
  try {
    return tourProgressFromPreferences(preferences);
  } catch {
    return null;
  }
}

async function authoritativeConflictResponse(userId: string) {
  const preferences = await getOrCreateUserPreferences(userId);
  if (!preferences) return NextResponse.json({ error: "Failed to reload tour progress" }, { status: 500 });
  const tour = readTourProgress(preferences);
  if (!tour) return NextResponse.json({ error: "Failed to reload tour progress" }, { status: 500 });
  return NextResponse.json({ error: "Tour progress changed", tour }, { status: 409 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const preferences = await getOrCreateUserPreferences(userId);
  if (!preferences) return NextResponse.json({ error: "Failed to load tour progress" }, { status: 500 });
  const tour = readTourProgress(preferences);
  if (!tour) return NextResponse.json({ error: "Failed to load tour progress" }, { status: 500 });
  return NextResponse.json({ tour });
}

export async function handleTourMutation(
  request: Request,
  activeVersion = ACTIVE_PRODUCT_TOUR_VERSION,
  now: () => Date = () => new Date(),
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = tourMutationRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid tour action" }, { status: 400 });

  const preferences = await getOrCreateUserPreferences(userId);
  if (!preferences) return NextResponse.json({ error: "Failed to load tour progress" }, { status: 500 });
  const current = readTourProgress(preferences);
  if (!current) return NextResponse.json({ error: "Failed to load tour progress" }, { status: 500 });
  const { expected, action } = parsed.data;
  if (
    current.tour_version !== expected.version
    || current.tour_status !== expected.status
    || current.tour_step !== expected.step
  ) {
    return NextResponse.json({ error: "Tour progress changed", tour: current }, { status: 409 });
  }

  let next;
  try {
    next = transitionTour(current, action, activeVersion);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tour action is unavailable" },
      { status: 409 },
    );
  }

  const tourUpdatedAt = now().toISOString();
  const payload = {
    tour_version: next.tour_version,
    tour_status: next.tour_status,
    tour_step: next.tour_step,
    tour_updated_at: tourUpdatedAt,
  };
  const admin = createSupabaseAdmin();
  const updated = await admin
    .from("user_preferences")
    .update(payload)
    .select(PREFERENCE_COLUMNS)
    .eq("user_id", userId)
    .eq("tour_version", current.tour_version)
    .eq("tour_status", current.tour_status)
    .eq("tour_step", current.tour_step)
    .single();

  if (updated.error) {
    if (updated.error.code === "PGRST116") return authoritativeConflictResponse(userId);
    return NextResponse.json({ error: "Failed to save tour progress" }, { status: 500 });
  }
  if (!updated.data) return authoritativeConflictResponse(userId);
  const verified = userPreferencesRowSchema.safeParse(updated.data);
  if (!verified.success || verified.data.user_id !== userId) {
    return NextResponse.json({ error: "Failed to save tour progress" }, { status: 500 });
  }
  return tourResponse(verified.data);
}

export async function POST(request: Request) {
  return handleTourMutation(request);
}
