import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { InboxNotification } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "inbox";
  const type = searchParams.get("type");
  const listId = searchParams.get("list_id");

  let query = supabase
    .from("inbox_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  switch (view) {
    case "subscribed":
      query = query.eq("is_archived", false);
      break;
    case "read":
      query = query.eq("is_read", true).eq("is_archived", false);
      break;
    case "snoozed":
      query = query.eq("is_snoozed", true).eq("is_archived", false).gt("snoozed_until", new Date().toISOString());
      break;
    default:
      // inbox = unread, not archived, not actively snoozed
      query = query
        .eq("is_read", false)
        .eq("is_archived", false)
        .or(`is_snoozed.eq.false,snoozed_until.lt.${new Date().toISOString()}`);
  }

  if (type) query = query.eq("event_type", type);
  if (listId) query = query.eq("list_id", listId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });

  const { count: unreadCount } = await supabase
    .from("inbox_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .eq("is_archived", false);

  return NextResponse.json({
    notifications: (data ?? []) as InboxNotification[],
    unread_count: unreadCount ?? 0,
  });
}
