import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createSupabaseAdmin();

  // Verify session belongs to user
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, tool_calls, tool_result, ui_blocks, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });

  return NextResponse.json({ session, messages: messages ?? [] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });

  return NextResponse.json({ success: true });
}
