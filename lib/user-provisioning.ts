import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import { createSupabaseAdmin } from "@/lib/supabase";

export async function ensureUserRecord(userId: string) {
  let user;
  try {
    user = await currentUser();
  } catch {
    throw new Error("Unable to load Clerk user");
  }

  const email = user?.primaryEmailAddress?.emailAddress?.trim();
  if (!user || user.id !== userId || !email) {
    throw new Error("Unable to load Clerk user");
  }

  const { error } = await createSupabaseAdmin().from("users").upsert(
    {
      id: userId,
      email,
    },
    { onConflict: "id" }
  );

  if (error) throw new Error("Unable to provision user record");
}
