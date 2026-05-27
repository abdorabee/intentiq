import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["is_read", "is_archived", "is_snoozed", "snoozed_until"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("inbox_notifications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });

  return NextResponse.json({ notification: data });
}
