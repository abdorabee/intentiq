import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdmin } from "@/lib/supabase";
import { createHash, randomBytes } from "crypto";

// GET — list all API keys for the logged-in user (key_hash never returned)
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data: keys } = await admin
    .from("api_keys")
    .select("id, label, last_used, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ keys: keys ?? [] });
}

// POST — generate a new API key
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label } = (await req.json()) as { label?: string };

  // Generate a secure random key: intentiq_<32 random hex chars>
  const rawKey = `intentiq_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const admin = createSupabaseAdmin();
  const { data: record, error } = await admin
    .from("api_keys")
    .insert({ user_id: user.id, key_hash: keyHash, label: label ?? "Default" })
    .select("id, label, last_used, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create key" }, { status: 500 });

  // Return raw key ONCE — it's never stored in plaintext
  return NextResponse.json({ key: rawKey, record }, { status: 201 });
}

// DELETE — revoke a key by id
export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createSupabaseAdmin();
  await admin
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", user.id); // scoped to user for safety

  return NextResponse.json({ success: true });
}
