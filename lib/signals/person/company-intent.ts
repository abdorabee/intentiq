import type { SignalResult, ApolloPersonData } from "@/lib/types";
import { createSupabaseAdmin } from "@/lib/supabase";

/**
 * Company Intent Signal (max: 20, weight: 20%)
 * Cross-references the person's company against existing company scores.
 * READ ONLY — never triggers a new company score (avoids double credit deduction).
 */
export async function fetchCompanyIntentSignal(
  person: ApolloPersonData,
  userId: string
): Promise<SignalResult> {
  const MAX = 20;

  const domain = person.organization?.primary_domain?.toLowerCase().trim();
  if (!domain) {
    return { score: 3, max: MAX, detail: "Company domain unknown — cannot cross-reference intent signals" };
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data: companyScore } = await supabase
      .from("scores")
      .select("score, score_band, company_name")
      .eq("user_id", userId)
      .eq("domain", domain)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!companyScore) {
      return {
        score: 3,
        max: MAX,
        detail: `${person.organization_name ?? domain} has not been scored yet — company intent unknown`,
      };
    }

    const companyName = companyScore.company_name ?? person.organization_name ?? domain;
    const band = companyScore.score_band;

    if (band === "HOT") {
      return { score: 20, max: MAX, detail: `${companyName} scored ${companyScore.score}/100 (HOT) — company is actively showing buying signals` };
    }
    if (band === "WARM") {
      return { score: 14, max: MAX, detail: `${companyName} scored ${companyScore.score}/100 (WARM) — company has meaningful intent signals` };
    }
    return { score: 7, max: MAX, detail: `${companyName} scored ${companyScore.score}/100 (COLD) — limited company-level buying signals` };
  } catch (err) {
    console.error("[company-intent] error:", err);
    return { score: 3, max: MAX, detail: "Failed to check company intent signals" };
  }
}
