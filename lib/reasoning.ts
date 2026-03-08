import type { SignalSet, ScoreBand, BuyingStage, UrgencyLevel } from "@/lib/types";

// OpenRouter — OpenAI-compatible API, free models available
// Docs: https://openrouter.ai/docs
// Free model: nvidia/nemotron-3-nano-30b-a3b:free

export interface ReasoningResult {
  ai_summary: string;
  recommended_action: string;
  buying_stage: BuyingStage;
  urgency: UrgencyLevel;
  key_triggers: string[];
  why_now: string;
  email_subject: string;
  talk_track: string;
}

function buildPrompt(company: string, score: number, band: ScoreBand, signals: SignalSet, productCategory: string): string {
  return `You are an expert B2B sales intelligence analyst at a platform like 6sense or Bombora.

COMPANY: ${company}
INTENT SCORE: ${score}/100 — ${band}
OUR PRODUCT CATEGORY: ${productCategory}

SIGNAL BREAKDOWN:
- Funding   (25% weight): ${signals.funding.score}/${signals.funding.max} pts — "${signals.funding.detail}"
- Hiring    (20% weight): ${signals.hiring.score}/${signals.hiring.max} pts — "${signals.hiring.detail}"
- News      (20% weight): ${signals.news.score}/${signals.news.max} pts — "${signals.news.detail}"
- Technology(20% weight): ${signals.technology.score}/${signals.technology.max} pts — "${signals.technology.detail}"
- Web       (15% weight): ${signals.web.score}/${signals.web.max} pts — "${signals.web.detail}"

Respond in strict JSON only (no markdown, no code block):
{
  "ai_summary": "3 sentences. Explain WHY this company scored ${score}/100, which signals drove the score, and what this signals about their buying readiness. Be analytical and specific — name the signals.",
  "buying_stage": "awareness|consideration|decision",
  "urgency": "act-now|this-week|this-month|nurture",
  "why_now": "1 sentence: what specific recent event or signal makes right now the ideal time to reach out.",
  "recommended_action": "ONE specific action for a salesperson. Reference a specific signal finding.",
  "email_subject": "A compelling email subject line under 60 chars that references a specific signal (e.g. recent funding, new hire, or tech adoption).",
  "talk_track": "2-3 sentence cold call or email opening. Be conversational, reference a specific trigger, and end with a clear question.",
  "key_triggers": ["most impactful signal finding", "second signal finding", "third signal finding"]
}`;
}

export async function generateReasoning(
  company: string,
  score: number,
  band: ScoreBand,
  signals: SignalSet,
  productCategory: string
): Promise<ReasoningResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Fallback when OPENROUTER_API_KEY is not set (dev mode)
  if (!apiKey) {
    const topSignal = Object.entries(signals)
      .filter(([k]) => k !== "latestSignalDate")
      .sort(([, a], [, b]) => (b as { score: number }).score - (a as { score: number }).score)[0];
    const [sigName, sigData] = topSignal as [string, { score: number; detail: string }];
    return {
      ai_summary: `[Mock AI] ${company} scores ${score}/100 (${band}). Strongest signal: ${sigName} — "${sigData.detail}". Add OPENROUTER_API_KEY to .env.local for real analysis.`,
      recommended_action: `[Mock] Reference their ${sigName} activity in your opening message.`,
      buying_stage: score >= 75 ? "decision" : score >= 50 ? "consideration" : "awareness",
      urgency: score >= 75 ? "act-now" : score >= 50 ? "this-week" : "nurture",
      key_triggers: [sigData.detail],
      why_now: `[Mock] Recent ${sigName} activity signals active buying motion.`,
      email_subject: `[Mock] Saw your ${sigName} signal — worth a chat?`,
      talk_track: `[Mock] Hi, I noticed ${company} has recent ${sigName} activity. We help companies in your position accelerate their buying process. Is this something worth 15 minutes?`,
    };
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-nano-30b-a3b:free",
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: "You are an expert B2B sales analyst. Be specific, concise, and actionable. Always respond with valid JSON only. Never include markdown or code blocks.",
        },
        { role: "user", content: buildPrompt(company, score, band, signals, productCategory) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const text = data.choices[0]?.message?.content ?? "";

  // Try direct parse, then regex extraction as fallback
  let parsed: ReasoningResult | null = null;
  try {
    parsed = JSON.parse(text) as ReasoningResult;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]) as ReasoningResult; } catch { /* ignore */ }
    }
  }

  if (parsed) return parsed;

  return {
    ai_summary: `${company} shows ${band.toLowerCase()} purchase intent with a score of ${score}/100.`,
    recommended_action: "Review the signal breakdown and reach out with a personalized message referencing their recent activity.",
    buying_stage: score >= 75 ? "decision" : score >= 50 ? "consideration" : "awareness",
    urgency: score >= 75 ? "act-now" : score >= 50 ? "this-week" : "nurture",
    key_triggers: [],
    why_now: "Recent signal activity indicates a potential buying window.",
    email_subject: `${company} — worth a quick chat?`,
    talk_track: `Hi, I came across ${company} and noticed some buying signals we track. We help companies like yours move faster on decisions like this. Would a 15-minute call make sense?`,
  };
}
