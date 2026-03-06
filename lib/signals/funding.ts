import type { SignalResult } from "@/lib/types";

interface CrunchbaseOrg {
  properties?: {
    last_funding_type?: string;
    last_funding_at?: string;
    total_funding_usd?: number;
    num_employees_enum?: string;
  };
}

function employeeGrowthScore(employeeEnum: string | undefined): number {
  // Crunchbase enum: c_00001_00010, c_00011_00050, ..., c_10001_max
  // Simple heuristic: larger bands = more growth potential
  if (!employeeEnum) return 0;
  if (employeeEnum.includes("10001")) return 5;
  if (employeeEnum.includes("5001")) return 4;
  if (employeeEnum.includes("1001")) return 3;
  return 0;
}

function daysSince(isoDate: string | undefined): number {
  if (!isoDate) return 999;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

export async function fetchFundingSignal(domain: string): Promise<SignalResult> {
  try {
    const url = `https://api.crunchbase.com/api/v4/entities/organizations/${domain}?user_key=${process.env.CRUNCHBASE_API_KEY}&field_ids=last_funding_type,last_funding_at,total_funding_usd,num_employees_enum`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) throw new Error(`Crunchbase ${res.status}`);

    const data = (await res.json()) as CrunchbaseOrg;
    const props = data.properties ?? {};

    let score = 0;
    const details: string[] = [];

    // Recent funding (last 90 days) = +20
    const age = daysSince(props.last_funding_at);
    if (age <= 90) {
      score += 20;
      details.push(
        `${props.last_funding_type ?? "Funding"} closed ${age}d ago`
      );
    } else if (age <= 365) {
      score += 10;
      details.push(`${props.last_funding_type ?? "Funding"} within last year`);
    }

    // Employee growth proxy
    const growthPts = employeeGrowthScore(props.num_employees_enum);
    score += growthPts;
    if (growthPts > 0) details.push("Large/growing headcount");

    return {
      score: Math.min(score, 25),
      max: 25,
      detail: details.join("; ") || "No recent funding activity detected",
    };
  } catch {
    // Graceful degradation
    return { score: 0, max: 25, detail: "Funding data unavailable" };
  }
}
