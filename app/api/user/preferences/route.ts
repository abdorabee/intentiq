import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase";
import {
  publicUserPreferences,
  userPreferencesPatchSchema,
  userPreferencesRowSchema,
} from "@/lib/user-preferences";
import {
  getOrCreateUserPreferences,
  PREFERENCE_COLUMNS,
} from "@/lib/user-preferences-server";

function invalidPreferencesResponse() {
  return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preferences = await getOrCreateUserPreferences(userId);
  if (!preferences) return invalidPreferencesResponse();

  return NextResponse.json({ preferences: publicUserPreferences(preferences) });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = userPreferencesPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid preferences",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdmin();
  const updated = await admin
    .from("user_preferences")
    .upsert(
      { user_id: userId, ...parsed.data },
      { onConflict: "user_id" },
    )
    .select(PREFERENCE_COLUMNS)
    .eq("user_id", userId)
    .single();

  if (updated.error || !updated.data) {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }

  const verified = userPreferencesRowSchema.safeParse(updated.data);
  if (!verified.success || verified.data.user_id !== userId) {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }

  return NextResponse.json({ preferences: publicUserPreferences(verified.data) });
}
