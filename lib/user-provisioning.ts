import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import { createSupabaseAdmin } from "@/lib/supabase";

export async function ensureUserRecord(userId: string) {
  let user;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }

  const admin = createSupabaseAdmin();
  await admin.from("users").upsert(
    {
      id: userId,
      email: user?.emailAddresses[0]?.emailAddress ?? "",
      plan: "free",
      credits_remaining: 20,
      onboarding_completed: false,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
}
