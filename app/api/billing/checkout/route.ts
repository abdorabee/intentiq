import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { initLemonSqueezy } from "@/lib/lemonsqueezy";

const PLAN_VARIANT_IDS: Record<string, string> = {
  starter: process.env.LEMON_VARIANT_STARTER ?? "",
  growth:  process.env.LEMON_VARIANT_GROWTH  ?? "",
  pro:     process.env.LEMON_VARIANT_PRO     ?? "",
  agency:  process.env.LEMON_VARIANT_AGENCY  ?? "",
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const plan = formData.get("plan") as string;

  if (!(plan in PLAN_VARIANT_IDS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  if (!PLAN_VARIANT_IDS[plan]) {
    return NextResponse.json({ error: "Payment not configured. Set LEMON_VARIANT_* env vars." }, { status: 503 });
  }

  initLemonSqueezy();
  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;

  const { data: checkout, error } = await createCheckout(storeId, PLAN_VARIANT_IDS[plan], {
    checkoutData: {
      custom: {
        user_id: userId,
        plan,
      },
    },
    productOptions: {
      redirectUrl: `${origin}/billing?success=true`,
    },
  });

  const checkoutUrl = checkout?.data?.attributes?.url;
  if (!checkoutUrl || error) {
    console.error("[billing/checkout] failed:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }

  return NextResponse.redirect(checkoutUrl, 303);
}
