import type { SignalSet, ScoreBand } from "@/lib/types";

// OpenRouter — OpenAI-compatible API, free models available
// Docs: https://openrouter.ai/docs
// Free model: nvidia/nemotron-3-nano-30b-a3b:free

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
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: "You are an expert B2B sales analyst. Be specific, concise, and actionable. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const text = data.choices[0]?.message?.content ?? "";

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
