import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { buildListsOverview, ensureDefaultList, previewSmartListCount } from "@/lib/lists-data";
import type { ListRule, ListType } from "@/lib/lists-types";
import { initialsFromName } from "@/lib/lists-display";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureDefaultList(userId);
  const { summaries, hero, lists } = await buildListsOverview(userId);
  return NextResponse.json({ lists, summaries, hero });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    description?: string;
    list_type?: ListType;
    color?: string;
    rules?: ListRule[];
    auto_refresh?: boolean;
    domains?: Array<{ domain: string; company_name?: string }>;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const listType = body.list_type ?? "manual";
  if (listType === "smart" && (!body.rules || body.rules.length === 0)) {
    return NextResponse.json({ error: "Smart lists require at least one rule" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: list, error } = await supabase
    .from("lists")
    .insert({
      user_id: userId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      list_type: listType,
      color: body.color ?? "#7170ff",
      icon_initials: initialsFromName(body.name.trim(), 2),
      rules: listType === "smart" ? body.rules : null,
      auto_refresh: body.auto_refresh ?? true,
      updated_at: now,
    })
    .select()
    .single();

  if (error || !list) {
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }

  if (listType === "manual" && body.domains?.length) {
    await supabase.from("list_members").insert(
      body.domains.map((d) => ({
        list_id: list.id,
        user_id: userId,
        domain: d.domain.toLowerCase(),
        company_name: d.company_name ?? d.domain,
      })),
    );
  }

  return NextResponse.json({ list }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { rules?: ListRule[] };
  if (!body.rules) return NextResponse.json({ error: "rules required" }, { status: 400 });

  const count = await previewSmartListCount(userId, body.rules);
  return NextResponse.json({ count });
}
