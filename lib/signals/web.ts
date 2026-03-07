import type { SignalResult } from "@/lib/types";

// Open PageRank API (free — 100 req/day)
// Sign up at: https://www.domcop.com/openpagerank/
interface OPRResponse {
  response?: Array<{
    page_rank_integer?: number;
    rank?: string;
    status_code?: number;
  }>;
}

export async function fetchWebSignal(domain: string): Promise<SignalResult> {
  try {
    const url = `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`;
    const res = await fetch(url, {
      headers: { "API-OPR": process.env.OPEN_PAGE_RANK_API_KEY ?? "" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error(`OpenPageRank ${res.status}`);

    const data = (await res.json()) as OPRResponse;
    const result = data.response?.[0];

    if (!result || result.status_code !== 200) {
      return { score: 0, max: 15, detail: "Domain not indexed" };
    }

    const opr = result.page_rank_integer ?? 0;
    const globalRank = result.rank ? parseInt(result.rank) : null;

    let score: number;
    let detail: string;

    if (opr >= 7) {
      score = 15;
      detail = `High authority domain (OPR: ${opr}/10)`;
    } else if (opr >= 5) {
      score = 10;
      detail = `Moderate authority domain (OPR: ${opr}/10)`;
    } else if (opr >= 3) {
      score = 5;
      detail = `Growing domain authority (OPR: ${opr}/10)`;
    } else if (opr >= 1) {
      score = 2;
      detail = `Low authority domain (OPR: ${opr}/10)`;
    } else {
      score = 0;
      detail = "New or unindexed domain";
    }

    if (globalRank && globalRank <= 100_000) {
      detail += ` — top 100K globally`;
    }

    return { score, max: 15, detail };
  } catch {
    return { score: 0, max: 15, detail: "Web authority data unavailable" };
  }
}
