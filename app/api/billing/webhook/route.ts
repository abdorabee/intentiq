import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PLAN_CREDITS } from "@/lib/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) break;

      if (session.metadata?.type === "topup") {
        // One-time credit purchase
        const credits = parseInt(session.metadata?.credits ?? "0");
        await Promise.all([
          admin.from("users").update({
            credits_remaining: admin.rpc("increment_credits", { p_user_id: userId, p_amount: credits }),
          }).eq("id", userId),
          admin.from("credits_log").insert({
            user_id: userId,
            amount: credits,
            type: "credit",
            reason: `Top-up purchase (${credits} credits)`,
          }),
        ]);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      const plan = sub.metadata?.plan as keyof typeof PLAN_CREDITS | undefined;

      if (!userId || !plan || !PLAN_CREDITS[plan]) break;

      await admin.from("users").update({
        plan,
        credits_remaining: PLAN_CREDITS[plan],
      }).eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;

      await admin.from("users").update({
        plan: "free",
        credits_remaining: PLAN_CREDITS.free,
      }).eq("id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

// App Router reads raw body via req.text() — no config needed
