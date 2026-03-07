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

    // Inverted-U curve: rewards growing mid-market (OPR 3-5) over large enterprises.
    // Mid-market companies are the most active B2B tool buyers.
    if (opr >= 8) {
      score = 7;
      detail = `Large enterprise domain (OPR: ${opr}/10) — longer sales cycles expected`;
    } else if (opr >= 6) {
      score = 10;
      detail = `Established domain (OPR: ${opr}/10)`;
    } else if (opr >= 3) {
      score = 13;
      detail = `Growing mid-market domain (OPR: ${opr}/10) — active buying profile`;
    } else if (opr >= 1) {
      score = 6;
      detail = `Early-stage domain (OPR: ${opr}/10)`;
    } else {
      score = 3;
      detail = "New domain — limited web presence";
    }

    if (globalRank && globalRank <= 100_000) {
      detail += ` — top 100K globally`;
    }

    return { score, max: 15, detail };
  } catch {
    return { score: 0, max: 15, detail: "Web authority data unavailable" };
  }
}
