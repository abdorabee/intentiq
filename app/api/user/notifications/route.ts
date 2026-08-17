import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase";

const notificationsUpdateSchema = z
  .object({
    notify_weekly_digest: z.boolean(),
    notify_credit_low: z.boolean(),
    notify_hot_signal: z.boolean(),
  })
  .partial();

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("notify_weekly_digest, notify_credit_low, notify_hot_signal")
    .eq("id", userId)
    .single();

  if (error) return NextResponse.json({ error: "Failed to fetch notification preferences" }, { status: 500 });

  return NextResponse.json({
    notify_weekly_digest: data?.notify_weekly_digest ?? true,
    notify_credit_low: data?.notify_credit_low ?? true,
    notify_hot_signal: data?.notify_hot_signal ?? true,
  });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = notificationsUpdateSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      {
        error: "At least one of notify_weekly_digest, notify_credit_low, notify_hot_signal is required",
        issues: parsed.success
          ? undefined
          : parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("users").update(parsed.data).eq("id", userId);

  if (error) return NextResponse.json({ error: "Failed to save notification preferences" }, { status: 500 });

  return NextResponse.json({ success: true });
}
