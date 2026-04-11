import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PLAN_CREDITS } from "@/lib/types";

// Reverse map: Polar product ID → plan name (for portal-initiated plan changes)
const PRODUCT_TO_PLAN: Record<string, string> = {
  [process.env.POLAR_PRODUCT_STARTER ?? ""]: "starter",
  [process.env.POLAR_PRODUCT_GROWTH  ?? ""]: "growth",
  [process.env.POLAR_PRODUCT_PRO     ?? ""]: "pro",
  [process.env.POLAR_PRODUCT_AGENCY  ?? ""]: "agency",
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ── Signature verification ───────────────────────────────────────────────────
  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(
      rawBody,
      Object.fromEntries(req.headers.entries()),
      process.env.POLAR_WEBHOOK_SECRET!
    );
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    throw err;
  }

  const admin = createSupabaseAdmin();

  // ── Idempotency check ────────────────────────────────────────────────────────
  // Polar retries failed deliveries — skip if we've already processed this event.
  const eventId = req.headers.get("webhook-id");
  if (eventId) {
    const { data: existing } = await admin
      .from("processed_webhook_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();
    if (existing) return NextResponse.json({ received: true });
  }

  // ── Event routing ────────────────────────────────────────────────────────────
  switch (event.type) {
    case "order.paid": {
      // One-time credit top-up purchase
      const meta = event.data.metadata as Record<string, string> | undefined;
      if (meta?.type !== "topup") break;

      const userId = meta?.user_id;
      if (!userId) break;

      const credits = parseInt(meta?.credits ?? "0", 10);
      if (credits <= 0) break;

      await Promise.all([
        admin.rpc("increment_credits", { p_user_id: userId, p_amount: credits }),
        admin.from("users")
          .update({ polar_customer_id: event.data.customerId })
          .eq("id", userId),
        admin.from("credits_log").insert({
          user_id: userId,
          amount: credits,
          type: "credit",
          reason: `Top-up purchase (${credits} credits)`,
        }),
      ]);
      break;
    }

    case "subscription.created": {
      const meta = event.data.metadata as Record<string, string> | undefined;
      const userId = meta?.user_id;
      if (!userId) break;

      const plan = PRODUCT_TO_PLAN[event.data.productId] ?? meta?.plan;
      if (!plan || !(plan in PLAN_CREDITS)) break;

      await admin.from("users").update({
        plan,
        credits_remaining: PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS],
        polar_customer_id: event.data.customerId,
        polar_subscription_id: event.data.id,
        subscription_renews_at: event.data.currentPeriodEnd?.toISOString() ?? null,
        subscription_cancel_at_period_end: event.data.cancelAtPeriodEnd ?? false,
      }).eq("id", userId);
      break;
    }

    case "subscription.updated": {
      // Fires for plan changes AND when user schedules a cancellation.
      // We always update the renewal date and cancel flag.
      // If cancelAtPeriodEnd=true we skip the plan/credits reset — user keeps
      // access until the period ends; subscription.canceled will handle downgrade.
      const meta = event.data.metadata as Record<string, string> | undefined;
      const userId = meta?.user_id;
      if (!userId) break;

      if (event.data.cancelAtPeriodEnd === true) {
        // Only update the cancel flag + renewal date, preserve plan
        await admin.from("users").update({
          subscription_renews_at: event.data.currentPeriodEnd?.toISOString() ?? null,
          subscription_cancel_at_period_end: true,
        }).eq("id", userId);
        break;
      }

      const plan = PRODUCT_TO_PLAN[event.data.productId] ?? meta?.plan;
      if (!plan || !(plan in PLAN_CREDITS)) break;

      await admin.from("users").update({
        plan,
        credits_remaining: PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS],
        polar_customer_id: event.data.customerId,
        polar_subscription_id: event.data.id,
        subscription_renews_at: event.data.currentPeriodEnd?.toISOString() ?? null,
        subscription_cancel_at_period_end: false,
      }).eq("id", userId);
      break;
    }

    case "subscription.canceled": {
      // Fires when the billing period actually ends — downgrade user to free
      const meta = event.data.metadata as Record<string, string> | undefined;
      const userId = meta?.user_id;
      if (!userId) break;

      await admin.from("users").update({
        plan: "free",
        credits_remaining: PLAN_CREDITS.free,
        polar_subscription_id: null,
        subscription_renews_at: null,
        subscription_cancel_at_period_end: false,
      }).eq("id", userId);
      break;
    }
  }

  // ── Mark event as processed ──────────────────────────────────────────────────
  if (eventId) {
    await admin
      .from("processed_webhook_events")
      .upsert({ id: eventId });
  }

  return NextResponse.json({ received: true });
}
