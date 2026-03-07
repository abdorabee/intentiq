import type { SignalResult } from "@/lib/types";

// Explorium API — 2-step: match domain → business_id, then enrich
// Docs: https://developers.explorium.ai
// Auth header: api_key
interface ExploriumMatchResponse {
  matched_businesses?: Array<{ business_id?: string }>;
}

interface ExploriumFundingResponse {
  known_funding_total_value?: number;
  last_funding_round_date?: string;   // YYYY-MM-DD
  last_funding_round_type?: string;
  number_of_funding_rounds?: number;
}

function daysSince(isoDate: string | undefined): number {
  if (!isoDate) return 999;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

export async function fetchFundingSignal(domain: string): Promise<SignalResult> {
  try {
    const headers = {
      "api_key": process.env.EXPLORIUM_API_KEY ?? "",
      "Content-Type": "application/json",
    };

    // Step 1: resolve domain → business_id
    const matchRes = await fetch("https://api.explorium.ai/v1/businesses/match", {
      method: "POST",
      headers,
      body: JSON.stringify({ businesses_to_match: [{ domain }] }),
      next: { revalidate: 86400 },
    });
    if (!matchRes.ok) throw new Error(`Explorium match ${matchRes.status}`);

    const matchData = (await matchRes.json()) as ExploriumMatchResponse;
    const businessId = matchData.matched_businesses?.[0]?.business_id;
    if (!businessId) return { score: 0, max: 25, detail: "Company not found" };

    // Step 2: fetch funding enrichment
    const fundingRes = await fetch("https://api.explorium.ai/v1/businesses/funding_and_acquisition/enrich", {
      method: "POST",
      headers,
      body: JSON.stringify({ business_id: businessId }),
      next: { revalidate: 86400 },
    });
    if (!fundingRes.ok) throw new Error(`Explorium funding ${fundingRes.status}`);

    const funding = (await fundingRes.json()) as ExploriumFundingResponse;

    let score = 0;
    const details: string[] = [];

    // Recent funding by date
    const age = daysSince(funding.last_funding_round_date);
    const roundType = funding.last_funding_round_type ?? "Funding";
    if (age <= 90) {
      score += 20;
      details.push(`${roundType} closed ${age}d ago`);
    } else if (age <= 365) {
      score += 10;
      details.push(`${roundType} within last year`);
    } else if (funding.known_funding_total_value) {
      score += 5;
      details.push(`$${(funding.known_funding_total_value / 1_000_000).toFixed(0)}M total raised`);
    }

    // Bonus for multiple rounds (signals active fundraising history)
    const rounds = funding.number_of_funding_rounds ?? 0;
    if (rounds >= 3) {
      score += 5;
      details.push(`${rounds} funding rounds`);
    }

    return {
      score: Math.min(score, 25),
      max: 25,
      detail: details.join("; ") || "No recent funding activity detected",
    };
  } catch {
    return { score: 0, max: 25, detail: "Funding data unavailable" };
  }
}
