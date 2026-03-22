import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { initLemonSqueezy } from "@/lib/lemonsqueezy";

const CREDIT_PACK_VARIANTS: Record<string, { credits: number; variantId: string }> = {
  "100":  { credits: 100,  variantId: process.env.LEMON_VARIANT_TOPUP_100  ?? "" },
  "500":  { credits: 500,  variantId: process.env.LEMON_VARIANT_TOPUP_500  ?? "" },
  "1000": { credits: 1000, variantId: process.env.LEMON_VARIANT_TOPUP_1000 ?? "" },
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const amount = formData.get("amount") as string;
  const pack = CREDIT_PACK_VARIANTS[amount];

  if (!pack) {
    return NextResponse.json({ error: "Invalid credit amount" }, { status: 400 });
  }
  if (!pack.variantId) {
    return NextResponse.json({ error: "Payment not configured. Set LEMON_VARIANT_TOPUP_* env vars." }, { status: 503 });
  }

  initLemonSqueezy();
  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;

  const { data: checkout, error } = await createCheckout(storeId, pack.variantId, {
    checkoutData: {
      custom: {
        user_id: userId,
        credits: String(pack.credits),
        type: "topup",
      },
    },
    productOptions: {
      redirectUrl: `${origin}/billing?topup=true`,
    },
  });

  const checkoutUrl = checkout?.data?.attributes?.url;
  if (!checkoutUrl || error) {
    console.error("[billing/topup] failed:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }

  return NextResponse.redirect(checkoutUrl, 303);
}
