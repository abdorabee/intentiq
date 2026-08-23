import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase";
import {
  userPreferencesRowSchema,
  type UserPreferencesRow,
} from "@/lib/user-preferences";

export const PREFERENCE_COLUMNS = [
  "user_id",
  "theme",
  "sidebar_collapsed",
  "analytics_enabled",
  "onboarding_version",
  "onboarding_revision",
  "onboarding_step",
  "onboarding_draft",
  "tour_version",
  "tour_status",
  "tour_step",
  "tour_updated_at",
  "updated_at",
].join(",");

function verifiedRow(row: unknown, userId: string): UserPreferencesRow | null {
  const parsed = userPreferencesRowSchema.safeParse(row);
  return parsed.success && parsed.data.user_id === userId ? parsed.data : null;
}

export async function getOrCreateUserPreferences(userId: string): Promise<UserPreferencesRow | null> {
  const admin = createSupabaseAdmin();
  const existing = await admin
    .from("user_preferences")
    .select(PREFERENCE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) return null;
  if (existing.data) return verifiedRow(existing.data, userId);

  const created = await admin
    .from("user_preferences")
    .insert({ user_id: userId })
    .select(PREFERENCE_COLUMNS)
    .single();

  if (!created.error) return verifiedRow(created.data, userId);
  if (created.error.code !== "23505") return null;

  const raced = await admin
    .from("user_preferences")
    .select(PREFERENCE_COLUMNS)
    .eq("user_id", userId)
    .single();

  return raced.error ? null : verifiedRow(raced.data, userId);
}
