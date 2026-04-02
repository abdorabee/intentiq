import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const [{ data: workflow }, { data: runs }] = await Promise.all([
    supabase
      .from("autopilot_workflows")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single(),
    supabase
      .from("autopilot_runs")
      .select("*")
      .eq("workflow_id", id)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  return NextResponse.json({ workflow, runs: runs ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const supabase = createSupabaseAdmin();

  // Only allow updating specific fields
  const allowed = ["name", "is_enabled", "source_type", "source_domains", "schedule", "conditions", "condition_logic", "actions"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // If schedule changed, recalculate next_run_at
  if (updates.schedule) {
    const intervalMs = updates.schedule === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    updates.next_run_at = new Date(Date.now() + intervalMs).toISOString();
  }

  const { data, error } = await supabase
    .from("autopilot_workflows")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("autopilot_workflows")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  return NextResponse.json({ success: true });
}
