import type { SignalResult } from "@/lib/types";

interface ApifyJobResult {
  title?: string;
  company?: string;
  postedAt?: string;
}

const RELEVANT_KEYWORDS = [
  "sales", "revenue", "crm", "ops", "operations", "marketing",
  "growth", "engineer", "developer", "product", "analyst",
];

function isRelevantJob(title: string | undefined): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  return RELEVANT_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function fetchHiringSignal(domain: string): Promise<SignalResult> {
  try {
    const companyName = domain.replace(/\.[^.]+$/, ""); // strip TLD as fallback
    const apifyUrl = `https://api.apify.com/v2/acts/apify~linkedin-jobs-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}`;

    const res = await fetch(apifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: companyName,
        maxResults: 20,
        publishedAt: "r2592000", // last 30 days
      }),
    });

    if (!res.ok) throw new Error(`Apify ${res.status}`);

    const jobs = (await res.json()) as ApifyJobResult[];
    const relevantJobs = jobs.filter((j) => isRelevantJob(j.title));

    const score = Math.min(relevantJobs.length * 4, 20);
    const detail =
      relevantJobs.length > 0
        ? `${relevantJobs.length} relevant open role(s): ${relevantJobs
            .slice(0, 3)
            .map((j) => j.title)
            .join(", ")}`
        : "No relevant job postings in the last 30 days";

    return { score, max: 20, detail };
  } catch {
    return { score: 0, max: 20, detail: "Hiring data unavailable" };
  }
}
