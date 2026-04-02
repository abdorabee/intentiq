import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const [{ data: run }, { data: actions }] = await Promise.all([
    supabase
      .from("autopilot_runs")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single(),
    supabase
      .from("autopilot_actions")
      .select("*")
      .eq("run_id", id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  return NextResponse.json({ run, actions: actions ?? [] });
}
