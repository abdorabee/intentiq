import type { SignalResult } from "@/lib/types";

interface BuiltWithResult {
  Results?: Array<{
    Result?: {
      Paths?: Array<{
        Technologies?: Array<{
          Name: string;
          FirstDetected?: number;
          LastDetected?: number;
        }>;
      }>;
    };
  }>;
}

const CRM_AND_SALES_TOOLS = [
  "HubSpot", "Salesforce", "Pipedrive", "Zoho CRM", "Monday.com",
  "Outreach", "SalesLoft", "Apollo", "Marketo", "Pardot",
  "ActiveCampaign", "Klaviyo", "Intercom", "Drift",
];

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export async function fetchTechnologySignal(domain: string): Promise<SignalResult> {
  try {
    const url = `https://api.builtwith.com/free1/api.json?KEY=${process.env.BUILTWITH_API_KEY}&LOOKUP=${domain}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) throw new Error(`BuiltWith ${res.status}`);

    const data = (await res.json()) as BuiltWithResult;
    const now = Date.now();
    let score = 0;
    const details: string[] = [];

    const technologies =
      data.Results?.[0]?.Result?.Paths?.flatMap((p) => p.Technologies ?? []) ?? [];

    for (const tech of technologies) {
      const isRelevant = CRM_AND_SALES_TOOLS.some((t) =>
        tech.Name.toLowerCase().includes(t.toLowerCase())
      );
      if (!isRelevant) continue;

      const firstDetectedMs = (tech.FirstDetected ?? 0) * 1000;
      const lastDetectedMs = (tech.LastDetected ?? 0) * 1000;

      // Newly adopted tool (first detected in last 90 days) = +15
      if (now - firstDetectedMs < NINETY_DAYS_MS) {
        score += 15;
        details.push(`New: ${tech.Name}`);
      }
      // Tool removed (migration signal) = +10
      else if (now - lastDetectedMs > NINETY_DAYS_MS && firstDetectedMs > 0) {
        score += 10;
        details.push(`Removed: ${tech.Name} (migration signal)`);
      }
      // Active tool in use (stable stack) = +5 baseline per tool, max 2
      else if (lastDetectedMs > 0 && details.filter((d) => d.startsWith("Active:")).length < 2) {
        score += 5;
        details.push(`Active: ${tech.Name}`);
      }
    }

    return {
      score: Math.min(score, 20),
      max: 20,
      detail: details.length > 0 ? details.join("; ") : "No significant tech stack changes detected",
    };
  } catch {
    return { score: 0, max: 20, detail: "Technology data unavailable" };
  }
}
