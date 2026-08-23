import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase";

type ClerkEmail = { id?: string; email_address?: string };

export async function POST(request: NextRequest) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request);
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type !== "user.updated" && event.type !== "user.deleted") {
    return new Response(null, { status: 204 });
  }

  const eventId = request.headers.get("svix-id")?.trim();
  const userId = event.data.id?.trim();
  if (!eventId || !userId) return new Response("Malformed lifecycle event", { status: 400 });

  let email: string | null = null;
  if (event.type === "user.updated") {
    const primaryId = event.data.primary_email_address_id;
    const addresses = event.data.email_addresses as ClerkEmail[];
    email = addresses.find((candidate) => candidate.id === primaryId)?.email_address?.trim() ?? null;
    if (!email) return new Response("Updated user has no primary email", { status: 400 });
  }

  const { error } = await createSupabaseAdmin().rpc(
    "process_clerk_user_lifecycle_event",
    {
      p_event_id: eventId,
      p_event_type: event.type,
      p_user_id: userId,
      p_email: email,
    },
  );

  if (error) return new Response("Lifecycle event processing failed", { status: 500 });
  return Response.json({ received: true });
}
