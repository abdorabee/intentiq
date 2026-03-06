import Anthropic from "@anthropic-ai/sdk";
import type { SignalSet, ScoreBand } from "@/lib/types";

// Lazy-init so missing API key doesn't crash the server on startup
let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

interface ReasoningResult {
  ai_summary: string;
  recommended_action: string;
}

export async function generateReasoning(
  company: string,
  score: number,
  band: ScoreBand,
  signals: SignalSet,
  productCategory: string
): Promise<ReasoningResult> {
  const prompt = `You are a B2B sales intelligence analyst. A company has been scored for purchase intent.
Given these signals, write a 2-sentence summary of WHY this company has this score,
and give ONE specific recommended action for a salesperson. Be concrete and actionable.
Do not be generic. Reference specific signals.

Company: ${company}
Intent Score: ${score}/100 (${band})
Signals: ${JSON.stringify(signals, null, 2)}
Our product category: ${productCategory}

Respond in strict JSON only (no markdown, no code block):
{ "ai_summary": "...", "recommended_action": "..." }`;

  const anthropic = getClient();

  // Fallback when ANTHROPIC_API_KEY is not set (dev mode)
  if (!anthropic) {
    const topSignal = Object.entries(signals)
      .filter(([k]) => k !== "latestSignalDate")
      .sort(([, a], [, b]) => (b as {score:number}).score - (a as {score:number}).score)[0];
    const [sigName, sigData] = topSignal as [string, {score:number; detail:string}];
    return {
      ai_summary: `[Mock AI] ${company} scores ${score}/100 (${band}). Strongest signal: ${sigName} — "${sigData.detail}". Add ANTHROPIC_API_KEY to .env.local for real analysis.`,
      recommended_action: `[Mock] Reference their ${sigName} activity in your opening message.`,
    };
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system:
      "You are an expert B2B sales analyst. Be specific, concise, and actionable. Always respond with valid JSON only.",
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const parsed = JSON.parse(text) as ReasoningResult;
    return parsed;
  } catch {
    return {
      ai_summary: `${company} shows intent signals with a score of ${score}/100.`,
      recommended_action: "Review the signal details and reach out with a personalized message.",
    };
  }
}
