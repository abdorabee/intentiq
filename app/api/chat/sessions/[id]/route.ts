import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { sanitizeUiBlocks } from "@/lib/gen-ui";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as {
    message_id?: string;
    ui_blocks?: unknown;
  };

  if (!("ui_blocks" in body)) {
    return NextResponse.json({ error: "ui_blocks is required" }, { status: 400 });
  }

  const uiBlocks = sanitizeUiBlocks(body.ui_blocks);
  const supabase = createSupabaseAdmin();

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  let messageId: string | null = typeof body.message_id === "string" && body.message_id
    ? body.message_id
    : null;

  if (messageId) {
    const { data } = await supabase
      .from("chat_messages")
      .update({ ui_blocks: uiBlocks })
      .eq("id", messageId)
      .eq("session_id", id)
      .select("id")
      .maybeSingle();
    if (!data) messageId = null;
  }

  if (!messageId) {
    const { data: latest } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("session_id", id)
      .eq("role", "assistant")
      .not("ui_blocks", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("chat_messages")
      .update({ ui_blocks: uiBlocks })
      .eq("id", latest.id)
      .eq("session_id", id)
      .select("id")
      .single();

    if (error || !data) return NextResponse.json({ error: "Failed to persist UI" }, { status: 500 });
    messageId = data.id;
  }

  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true, message_id: messageId });
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
