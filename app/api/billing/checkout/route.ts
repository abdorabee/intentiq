import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  growth:  process.env.STRIPE_PRICE_GROWTH  ?? "",
  pro:     process.env.STRIPE_PRICE_PRO     ?? "",
  agency:  process.env.STRIPE_PRICE_AGENCY  ?? "",
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();

  const formData = await req.formData();
  const plan = formData.get("plan") as string;

  if (!PLAN_PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .single();

  // Create or retrieve Stripe customer
  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: profile?.email ?? clerkUser?.emailAddresses[0]?.emailAddress,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;
    await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", userId);
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PLAN_PRICE_IDS[plan], quantity: 1 }],
    success_url: `${origin}/billing?success=true`,
    cancel_url: `${origin}/billing`,
    metadata: { supabase_user_id: userId, plan },
  });

  return NextResponse.redirect(session.url!, 303);
}
