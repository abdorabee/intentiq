import { createSupabaseAdmin } from "@/lib/supabase";
import type { InboxEventType } from "@/lib/types";

interface CreateNotificationPayload {
  user_id: string;
  event_type: InboxEventType;
  domain: string;
  company_name: string;
  title: string;
  summary: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  list_id?: string;
}

export async function createInboxNotification(payload: CreateNotificationPayload): Promise<void> {
  try {
    const supabase = createSupabaseAdmin();
    await supabase.from("inbox_notifications").insert(payload);
  } catch {
    // fire-and-forget: never throw — a failed notification must not block scoring
  }
}
