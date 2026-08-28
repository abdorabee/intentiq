import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import {
  mergeUserPreferences,
  parsePreferencesPatch,
  toPreferencesResponse,
} from "@/lib/user-preferences";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", userId)
    .single();

  if (error) return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });

  return NextResponse.json(toPreferencesResponse(data?.preferences));
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

  const parsed = parsePreferencesPatch(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid preferences",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const { data: current, error: readError } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", userId)
    .single();

  if (readError) {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }

  const preferences = mergeUserPreferences(current?.preferences, parsed.data);
  const { error } = await supabase
    .from("users")
    .update({ preferences })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });

  return NextResponse.json({ preferences });
}
