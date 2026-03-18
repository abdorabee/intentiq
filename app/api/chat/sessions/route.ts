import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });

  return NextResponse.json({ sessions: sessions ?? [] });
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const { data: session, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: userId })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create session" }, { status: 500 });

  return NextResponse.json({ session });
}
