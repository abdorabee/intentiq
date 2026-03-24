import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";

const DEFAULT_LIMIT = 20;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createSupabaseAdmin();

  // Count query
  let countQuery = supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (q) {
    countQuery = countQuery.or(`company_name.ilike.%${q}%,domain.ilike.%${q}%`);
  }

  const { count } = await countQuery;
  const total = count ?? 0;

  // Data query
  let query = supabase
    .from("scores")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`company_name.ilike.%${q}%,domain.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });

  return NextResponse.json({
    scores: data ?? [],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
