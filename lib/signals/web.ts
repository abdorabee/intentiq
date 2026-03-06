import type { SignalResult } from "@/lib/types";

interface SimilarWebVisits {
  visits?: number;
}

interface SimilarWebResponse {
  visits?: SimilarWebVisits[];
}

export async function fetchWebSignal(domain: string): Promise<SignalResult> {
  try {
    const startDate = getMonthOffset(-2); // 2 months ago
    const endDate = getMonthOffset(-1);   // last complete month
    const url = `https://api.similarweb.com/v1/website/${domain}/traffic-and-engagement/visits?api_key=${process.env.SIMILARWEB_API_KEY}&start_date=${startDate}&end_date=${endDate}&granularity=monthly&main_domain_only=false&format=json`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`SimilarWeb ${res.status}`);

    const data = (await res.json()) as SimilarWebResponse;
    const visits = data.visits ?? [];

    if (visits.length < 2) {
      return { score: 5, max: 15, detail: "Limited web traffic data available" };
    }

    const prev = visits[visits.length - 2]?.visits ?? 0;
    const curr = visits[visits.length - 1]?.visits ?? 0;

    if (prev === 0) {
      return { score: 0, max: 15, detail: "Insufficient traffic history" };
    }

    const growthPct = ((curr - prev) / prev) * 100;
    let score: number;
    let detail: string;

    if (growthPct >= 20) {
      score = 15;
      detail = `Traffic up ${Math.round(growthPct)}% MoM — strong growth signal`;
    } else if (growthPct >= 5) {
      score = 8;
      detail = `Traffic up ${Math.round(growthPct)}% MoM — moderate growth`;
    } else if (growthPct >= -5) {
      score = 4;
      detail = "Traffic stable MoM";
    } else {
      score = 0;
      detail = `Traffic down ${Math.round(Math.abs(growthPct))}% MoM`;
    }

    return { score, max: 15, detail };
  } catch {
    return { score: 0, max: 15, detail: "Web traffic data unavailable" };
  }
}

function getMonthOffset(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
