import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { scoreCompany, domainToCompanyName } from "@/lib/score-service";
import { evaluateConditions } from "@/lib/autopilot";
import type { DbAutopilotWorkflow, ScoreBand } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflow_id, domain } = (await req.json()) as { workflow_id: string; domain: string };
  if (!workflow_id || !domain) {
    return NextResponse.json({ error: "workflow_id and domain are required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const [{ data: workflow }, { data: user }, { data: watchlistEntry }] = await Promise.all([
    supabase.from("autopilot_workflows").select("*").eq("id", workflow_id).eq("user_id", userId).single(),
    supabase.from("users").select("*").eq("id", userId).single(),
    supabase.from("watchlist").select("score, score_band").eq("user_id", userId).eq("domain", domain.toLowerCase()).eq("is_active", true).maybeSingle(),
  ]);

  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const typedWorkflow = workflow as DbAutopilotWorkflow;

  // Score the company (costs 1 credit)
  const scoreResult = await scoreCompany({
    domain,
    userId,
    companyName: domainToCompanyName(domain),
    productCategory: user.product_category ?? "B2B SaaS",
    businessProfile: user.business_profile,
  });

  const oldScore = watchlistEntry?.score ?? null;
  const oldBand = (watchlistEntry?.score_band ?? null) as ScoreBand | null;

  const { triggered, reasons } = evaluateConditions(
    typedWorkflow.conditions,
    typedWorkflow.condition_logic,
    {
      oldScore,
      newScore: scoreResult.intent_score,
      oldBand,
      newBand: scoreResult.score_band,
      signals: scoreResult.signals,
    }
  );

  return NextResponse.json({
    test_result: {
      domain,
      company: scoreResult.company,
      old_score: oldScore,
      new_score: scoreResult.intent_score,
      old_band: oldBand,
      new_band: scoreResult.score_band,
      triggered,
      trigger_reasons: reasons,
      actions_that_would_fire: triggered ? typedWorkflow.actions.map((a) => a.type) : [],
    },
  });
}
