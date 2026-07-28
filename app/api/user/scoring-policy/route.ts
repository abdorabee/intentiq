import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { normalizeScoringPolicy } from "@/lib/scoring-policy";
import { SCORING_VERSION_V3 } from "@/lib/scorer";

function boundedSelector(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase().slice(0, max)
    : null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const columns = "id, name, version, icp_key, vertical, policy, active, created_at, updated_at";
  const [owned, defaults] = await Promise.all([
    supabase
      .from("scoring_policies")
      .select(columns)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("scoring_policies")
      .select(columns)
      .is("user_id", null)
      .order("created_at", { ascending: false }),
  ]);
  if (owned.error || defaults.error) {
    return NextResponse.json({ error: "Unable to load scoring policies" }, { status: 500 });
  }
  return NextResponse.json({ policies: [...(owned.data ?? []), ...(defaults.data ?? [])] });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as Record<string, unknown>;
  const policy = normalizeScoringPolicy(body.policy);
  if (!policy || policy.version !== SCORING_VERSION_V3) {
    return NextResponse.json({ error: "Invalid v3 scoring policy" }, { status: 400 });
  }
  const name = typeof body.name === "string" && body.name.trim()
    ? body.name.trim().slice(0, 120)
    : "Custom readiness policy";
  const supabase = createSupabaseAdmin();
  const values = {
    user_id: userId,
    name,
    version: SCORING_VERSION_V3,
    icp_key: boundedSelector(body.icp_key, 128),
    vertical: boundedSelector(body.vertical, 120),
    policy,
    active: body.active !== false,
    updated_at: new Date().toISOString(),
  };

  const query = typeof body.id === "string"
    ? supabase
        .from("scoring_policies")
        .update(values)
        .eq("id", body.id)
        .eq("user_id", userId)
    : supabase.from("scoring_policies").insert(values);
  const { data, error } = await query
    .select("id, name, version, icp_key, vertical, policy, active, created_at, updated_at")
    .single();
  if (error) return NextResponse.json({ error: "Unable to save scoring policy" }, { status: 500 });
  return NextResponse.json({ policy: data });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as { id?: unknown };
  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid policy ID" }, { status: 400 });
  }
  const { error } = await createSupabaseAdmin()
    .from("scoring_policies")
    .delete()
    .eq("id", body.id)
    .eq("user_id", userId);
  if (error) return NextResponse.json({ error: "Unable to delete scoring policy" }, { status: 500 });
  return NextResponse.json({ success: true });
}
