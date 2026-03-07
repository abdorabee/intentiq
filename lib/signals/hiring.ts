import type { SignalResult } from "@/lib/types";

interface ApifyJobResult {
  title?: string;
  company?: string;
  postedAt?: string;
}

// Role tiers weighted by purchase-intent signal strength
const HIGH_INTENT = ["sales", "sdr", "bdr", "account executive", "revenue", "business development"];
const MEDIUM_INTENT = ["marketing", "growth", "operations", "ops", "product", "analyst"];
const LOW_INTENT = ["engineer", "developer", "designer"];

function jobPoints(title: string | undefined): number {
  if (!title) return 0;
  const lower = title.toLowerCase();
  if (HIGH_INTENT.some((kw) => lower.includes(kw))) return 6;
  if (MEDIUM_INTENT.some((kw) => lower.includes(kw))) return 4;
  if (LOW_INTENT.some((kw) => lower.includes(kw))) return 2;
  return 0;
}

export async function fetchHiringSignal(domain: string): Promise<SignalResult> {
  try {
    // Extract clean company name: "stripe.com" → "stripe"
    const hostname = domain.replace(/^https?:\/\//, "").split("/")[0];
    const parts = hostname.split(".");
    const companyName = parts.length >= 2 ? parts[parts.length - 2] : parts[0];

    // Apify sync runs can take 60-120s — enforce a 40s timeout to avoid hanging
    const apifyUrl = `https://api.apify.com/v2/acts/apify~linkedin-jobs-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}&timeout=35`;

    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 38_000);

    let res: Response;
    try {
      res = await fetch(apifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: companyName,
          maxResults: 20,
          publishedAt: "r2592000", // last 30 days
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(abortTimer);
    }

    if (!res.ok) throw new Error(`Apify ${res.status}`);

    const jobs = (await res.json()) as ApifyJobResult[];

    let score = 0;
    const matchedTitles: string[] = [];
    for (const job of jobs) {
      const pts = jobPoints(job.title);
      if (pts > 0) {
        score += pts;
        if (matchedTitles.length < 3) matchedTitles.push(job.title ?? "");
      }
    }
    score = Math.min(score, 20);

    const detail =
      matchedTitles.length > 0
        ? `${matchedTitles.length}+ relevant open role(s): ${matchedTitles.join(", ")}`
        : "No relevant job postings in the last 30 days";

    return { score, max: 20, detail };
  } catch {
    return { score: 0, max: 20, detail: "Hiring data unavailable" };
  }
}
