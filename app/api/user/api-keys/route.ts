import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createHash, randomBytes } from "crypto";
import {
  API_KEY_LIMITS,
  apiKeyIdSchema,
  apiKeyLabelSchema,
  apiKeyRecordSchema,
  isPlan,
  publicApiKeyRecord,
} from "@/lib/api-keys";

const API_KEY_COLUMNS = "id,user_id,label,last_used,is_active,created_at";

async function loadPlan(admin: ReturnType<typeof createSupabaseAdmin>, userId: string) {
  const result = await admin
    .from("users")
    .select("plan")
    .eq("id", userId)
    .single();

  return result.error || !isPlan(result.data?.plan) ? null : result.data.plan;
}

// GET — list all API keys for the logged-in user (key_hash never returned)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const [{ data: keys, error }, plan] = await Promise.all([
    admin
    .from("api_keys")
    .select(API_KEY_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false }),
    loadPlan(admin, userId),
  ]);

  if (error || !plan) {
    return NextResponse.json({ error: "Failed to load API keys" }, { status: 500 });
  }

  const verified = (keys ?? []).flatMap((row) => {
    const parsed = apiKeyRecordSchema.safeParse(row);
    return parsed.success && parsed.data.user_id === userId
      ? [publicApiKeyRecord(parsed.data)]
      : [];
  });

  if (verified.length !== (keys ?? []).length) {
    return NextResponse.json({ error: "Failed to load API keys" }, { status: 500 });
  }

  return NextResponse.json({ keys: verified, limit: API_KEY_LIMITS[plan], plan });
}

// POST — generate a new API key
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsedBody = apiKeyLabelSchema.safeParse(
    typeof body === "object" && body !== null && "label" in body
      ? body.label
      : undefined,
  );
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Label must be between 1 and 48 characters" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const plan = await loadPlan(admin, userId);
  if (!plan) return NextResponse.json({ error: "Failed to load plan" }, { status: 500 });

  const active = await admin
    .from("api_keys")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (active.error) return NextResponse.json({ error: "Failed to check key limit" }, { status: 500 });

  const limit = API_KEY_LIMITS[plan];
  if ((active.data?.length ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Your ${plan} plan allows ${limit} active API key${limit === 1 ? "" : "s"}`, limit, plan },
      { status: 409 },
    );
  }

  // Generate a secure random key: vesperwise_<32 random hex chars>
  const rawKey = `vesperwise_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const { data: record, error } = await admin
    .from("api_keys")
    .insert({ user_id: userId, key_hash: keyHash, label: parsedBody.data })
    .select(API_KEY_COLUMNS)
    .single();

  const verified = apiKeyRecordSchema.safeParse(record);
  if (error || !verified.success || verified.data.user_id !== userId) {
    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }

  // Return raw key ONCE — it's never stored in plaintext
  return NextResponse.json({ key: rawKey, record: publicApiKeyRecord(verified.data) }, { status: 201 });
}

// DELETE — revoke a key by id
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsedId = apiKeyIdSchema.safeParse(searchParams.get("id"));
  if (!parsedId.success) return NextResponse.json({ error: "A valid key id is required" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: record, error } = await admin
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", parsedId.data)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select(API_KEY_COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  if (!record) return NextResponse.json({ error: "Active API key not found" }, { status: 404 });

  const verified = apiKeyRecordSchema.safeParse(record);
  if (!verified.success || verified.data.user_id !== userId || verified.data.is_active) {
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }

  return NextResponse.json({ record: publicApiKeyRecord(verified.data) });
}
