import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

// Credit packs: amount → { credits, price_cents }
const CREDIT_PACKS: Record<string, { credits: number; price_cents: number }> = {
  "100":  { credits: 100,  price_cents: 800  },
  "500":  { credits: 500,  price_cents: 4000 },
  "1000": { credits: 1000, price_cents: 8000 },
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();

  const formData = await req.formData();
  const amount = formData.get("amount") as string;
  const pack = CREDIT_PACKS[amount];

  if (!pack) {
    return NextResponse.json({ error: "Invalid credit amount" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .single();

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
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `IntentIQ — ${pack.credits} Credits` },
        unit_amount: pack.price_cents,
      },
      quantity: 1,
    }],
    success_url: `${origin}/billing?topup=true`,
    cancel_url: `${origin}/billing`,
    metadata: { supabase_user_id: userId, credits: String(pack.credits), type: "topup" },
  });

  return NextResponse.redirect(session.url!, 303);
}
