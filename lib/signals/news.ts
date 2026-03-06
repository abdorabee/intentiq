import type { SignalResult } from "@/lib/types";

interface GNewsArticle {
  title: string;
  description?: string;
  publishedAt: string;
}

interface GNewsResponse {
  articles: GNewsArticle[];
}

const POSITIVE_TRIGGERS: Array<{ keywords: string[]; pts: number; label: string }> = [
  { keywords: ["raised", "funding", "series", "seed", "investment", "million"], pts: 8, label: "funding round" },
  { keywords: ["ceo", "cto", "cmo", "chief", "vp ", "vice president", "appointed", "joins as"], pts: 7, label: "leadership change" },
  { keywords: ["launches", "launch", "introduces", "announces", "new product"], pts: 5, label: "product launch" },
  { keywords: ["partnership", "acquires", "acquisition", "merger"], pts: 5, label: "strategic partnership/M&A" },
  { keywords: ["expansion", "expands", "opens office", "new market"], pts: 4, label: "expansion" },
];

const NEGATIVE_TRIGGERS: Array<{ keywords: string[]; pts: number; label: string }> = [
  { keywords: ["layoffs", "laid off", "reduces workforce", "cuts jobs"], pts: -10, label: "layoffs" },
  { keywords: ["scandal", "fraud", "lawsuit", "investigation"], pts: -8, label: "controversy" },
];

function scoreArticles(articles: GNewsArticle[]): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];

  for (const article of articles) {
    const text = `${article.title} ${article.description ?? ""}`.toLowerCase();

    for (const trigger of POSITIVE_TRIGGERS) {
      if (trigger.keywords.some((kw) => text.includes(kw))) {
        score += trigger.pts;
        details.push(trigger.label);
        break;
      }
    }
    for (const trigger of NEGATIVE_TRIGGERS) {
      if (trigger.keywords.some((kw) => text.includes(kw))) {
        score += trigger.pts;
        details.push(trigger.label);
        break;
      }
    }
  }

  return { score: Math.max(0, Math.min(score, 20)), details: [...new Set(details)] };
}

export async function fetchNewsSignal(company: string): Promise<SignalResult> {
  try {
    const q = encodeURIComponent(company);
    const url = `https://gnews.io/api/v4/search?q=${q}&lang=en&max=10&apikey=${process.env.GNEWS_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 43200 } }); // 12hr cache

    if (!res.ok) throw new Error(`GNews ${res.status}`);

    const data = (await res.json()) as GNewsResponse;
    const { score, details } = scoreArticles(data.articles ?? []);

    return {
      score,
      max: 20,
      detail: details.length > 0 ? details.join(", ") : "No significant trigger events detected",
    };
  } catch {
    return { score: 0, max: 20, detail: "News data unavailable" };
  }
}
