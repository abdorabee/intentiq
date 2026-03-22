import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PLAN_CREDITS } from "@/lib/types";
import crypto from "crypto";

// Reverse map: variant ID → plan name (for portal-initiated plan changes)
const VARIANT_TO_PLAN: Record<string, string> = {
  [process.env.LEMON_VARIANT_STARTER ?? ""]: "starter",
  [process.env.LEMON_VARIANT_GROWTH  ?? ""]: "growth",
  [process.env.LEMON_VARIANT_PRO     ?? ""]: "pro",
  [process.env.LEMON_VARIANT_AGENCY  ?? ""]: "agency",
};

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const eventName: string = payload.meta?.event_name;
  const customData = payload.meta?.custom_data ?? {};
  const admin = createSupabaseAdmin();

  switch (eventName) {
    case "order_completed": {
      // One-time credit top-up purchase
      if (customData.type !== "topup") break;
      const userId = customData.user_id;
      if (!userId) break;

      const credits = parseInt(customData.credits ?? "0");
      const lemonCustomerId = String(payload.data?.attributes?.customer_id ?? "");

      await Promise.all([
        admin.rpc("increment_credits", { p_user_id: userId, p_amount: credits }),
        admin.from("users").update({ lemon_customer_id: lemonCustomerId }).eq("id", userId),
        admin.from("credits_log").insert({
          user_id: userId,
          amount: credits,
          type: "credit",
          reason: `Top-up purchase (${credits} credits)`,
        }),
      ]);
      break;
    }

    case "subscription_created":
    case "subscription_updated": {
      const userId = customData.user_id;
      if (!userId) break;

      // Prefer variant_id mapping (handles portal-initiated changes)
      const variantId = String(payload.data?.attributes?.variant_id ?? "");
      const plan = VARIANT_TO_PLAN[variantId] ?? customData.plan;
      if (!plan || !PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS]) break;

      const lemonCustomerId = String(payload.data?.attributes?.customer_id ?? "");
      const lemonSubscriptionId = String(payload.data?.id ?? "");

      await admin.from("users").update({
        plan,
        credits_remaining: PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS],
        lemon_customer_id: lemonCustomerId,
        lemon_subscription_id: lemonSubscriptionId,
      }).eq("id", userId);
      break;
    }

    case "subscription_cancelled": {
      const userId = customData.user_id;
      if (!userId) break;

      await admin.from("users").update({
        plan: "free",
        credits_remaining: PLAN_CREDITS.free,
        lemon_subscription_id: null,
      }).eq("id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
