import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { PipelineStage } from "@/lib/types";

const VALID_STAGES: PipelineStage[] = ["cold", "warming", "hot", "engaged", "converted"];

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain, stage } = (await req.json()) as { domain: string; stage: string };

  if (!domain || !stage || !VALID_STAGES.includes(stage as PipelineStage)) {
    return NextResponse.json({ error: "Invalid domain or stage" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("watchlist")
    .update({
      pipeline_stage: stage,
      stage_changed_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("domain", domain.toLowerCase().trim())
    .eq("is_active", true);

  if (error) return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });

  return NextResponse.json({ success: true, domain, stage });
}
