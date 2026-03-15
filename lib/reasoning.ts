import type { SignalSet, ScoreBand, BuyingStage, UrgencyLevel } from "@/lib/types";

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
  const verdict =
    band === "HOT"  ? "actively in a buying window — this is an urgent, high-value opportunity" :
    band === "WARM" ? "showing meaningful buying signals but not yet in active evaluation" :
                     "early-stage or low-signal — likely not in an active buying cycle right now";

  return `You are IntentIQ's AI sales intelligence engine. Your job is to analyze purchase intent signals and brief a sales rep clearly and specifically — like a sharp analyst who's done deep research on this account before a call.

COMPANY: ${company}
INTENT SCORE: ${score}/100 — ${band}
VERDICT: This company is ${verdict}.
PRODUCT CATEGORY WE SELL: ${productCategory}

SIGNAL DATA (what we actually found):
- Funding    (25 pts max): ${signals.funding.score}/${signals.funding.max} scored → "${signals.funding.detail}"
- Hiring     (20 pts max): ${signals.hiring.score}/${signals.hiring.max} scored → "${signals.hiring.detail}"
- News       (20 pts max): ${signals.news.score}/${signals.news.max} scored → "${signals.news.detail}"
- Technology (20 pts max): ${signals.technology.score}/${signals.technology.max} scored → "${signals.technology.detail}"
- Web        (15 pts max): ${signals.web.score}/${signals.web.max} scored → "${signals.web.detail}"

INSTRUCTIONS:
- Be specific. Quote or paraphrase actual signal details — never speak in generic terms like "strong hiring" without citing what was found.
- Write like you're briefing a rep 10 minutes before their call. Confident, direct, no filler.
- The ai_summary should feel like an AI model that has genuinely read and synthesized the data — analytical but conversational.
- The talk_track must feel personal and natural, not like a template. Reference something specific from the signal data.
- Only include key_triggers for signals that scored above 50% of their max.
- If a signal scored 0 or very low, do not pretend it is a strength.

Respond in strict JSON only — no markdown, no code fences, no extra text:
{
  "ai_summary": "4-5 sentences. Open with a direct verdict on buying readiness based on the score. Explain which 2-3 signals had the most weight and specifically what they revealed. Tell the rep what to expect when they reach out — is this company actively evaluating solutions, just exploring, or unlikely to engage now? Close with one concrete insight that will make the rep sound informed on the call.",
  "buying_stage": "awareness|consideration|decision",
  "urgency": "act-now|this-week|this-month|nurture",
  "why_now": "1-2 sentences. Cite the single most time-sensitive signal — a recent funding event, a key hire, a news trigger, a technology adoption. Explain why it creates a window now specifically.",
  "recommended_action": "One specific, tactical next step. Name the signal it's based on. Tell the rep exactly what angle to lead with — don't just say 'reach out'.",
  "email_subject": "Under 55 characters. Reference something specific from the signal data — a funding event, a job title, a product launch, a news item. Make it feel researched, not templated.",
  "talk_track": "3-4 sentences written as a natural cold open. Start by referencing something specific you noticed about the company (from the signals). Pivot to the pain or opportunity that creates. End with a soft, assumptive question that presumes they're already thinking about this problem.",
  "key_triggers": ["most impactful specific finding from signal data", "second most impactful specific finding", "third finding if signal scored above half its max — skip if not"]
}`;
}

function buildMockResult(company: string, score: number, band: ScoreBand, signals: SignalSet): ReasoningResult {
  // Sort signals by score ratio to find top signals
  const ranked = (["funding", "hiring", "news", "technology", "web"] as const)
    .map((k) => ({ key: k, sig: signals[k], ratio: signals[k].score / signals[k].max }))
    .sort((a, b) => b.ratio - a.ratio);

  const top = ranked[0];
  const second = ranked[1];

  const stageMap: Record<ScoreBand, BuyingStage> = { HOT: "decision", WARM: "consideration", COLD: "awareness" };
  const urgencyMap: Record<ScoreBand, UrgencyLevel> = { HOT: "act-now", WARM: "this-week", COLD: "nurture" };

  const summaries: Record<ScoreBand, string> = {
    HOT: `${company} is scoring ${score}/100 — that puts them firmly in active buying territory. The strongest signal here is ${top.key}: "${top.sig.detail}". Combined with ${second.key} data showing "${second.sig.detail}", this account is showing the classic pattern of a company mid-evaluation for a new solution. When you reach out, expect an informed buyer — they're likely already comparing vendors. Lead with specificity: reference the ${top.key} signal directly and ask what they're currently solving for.`,
    WARM: `${company} sits at ${score}/100 — a solid WARM signal that warrants attention this week. The score is primarily driven by ${top.key} activity: "${top.sig.detail}". Their ${second.key} data adds context: "${second.sig.detail}". This isn't a company in full evaluation mode yet, but the signals suggest they're starting to think about problems in your space. The right move is a targeted outreach that surfaces a problem before they've fully defined it — position yourself as the expert, not a vendor pitching features.`,
    COLD: `${company} scores ${score}/100, which reflects limited buying intent signals at this time. Their strongest signal is ${top.key} at ${Math.round(top.ratio * 100)}% of max: "${top.sig.detail}". The remaining signals are quiet. This doesn't mean they'll never buy — it means now isn't the window. A light-touch nurture sequence that delivers value without a hard pitch is the right approach. Check back in 30-60 days or when a signal changes.`,
  };

  const triggers = ranked
    .filter((r) => r.ratio > 0.5)
    .slice(0, 3)
    .map((r) => r.sig.detail);

  return {
    ai_summary: summaries[band],
    recommended_action:
      band === "HOT"
        ? `Call ${company} today and lead with their ${top.key} signal: "${top.sig.detail}". Ask what initiative that's tied to — it's your way in.`
        : band === "WARM"
        ? `Send a targeted email this week referencing their ${top.key} activity. Position it as a timely observation, not a sales pitch.`
        : `Add ${company} to a 60-day nurture sequence. Share a relevant case study and set a signal-based alert to re-engage when their score rises.`,
    buying_stage: stageMap[band],
    urgency: urgencyMap[band],
    key_triggers: triggers.length > 0 ? triggers : [top.sig.detail],
    why_now:
      band === "HOT"
        ? `Their ${top.key} signal just hit high levels: "${top.sig.detail}". This typically precedes an active vendor evaluation by 2-4 weeks — the window is open now.`
        : band === "WARM"
        ? `The ${top.key} signal at "${top.sig.detail}" suggests they're starting to think about this problem space. Reaching out before they've formed vendor opinions gives you a positioning advantage.`
        : `No time-sensitive trigger exists right now. Monitor for a change in their ${top.key} or ${second.key} signals before investing outreach time.`,
    email_subject:
      band === "HOT"
        ? `${company} + ${top.key} activity — quick question`
        : band === "WARM"
        ? `Noticed something about ${company}'s ${top.key}`
        : `Keeping ${company} on the radar`,
    talk_track:
      band === "HOT"
        ? `Hi — I was looking at ${company} and noticed some interesting signals: "${top.sig.detail}". That usually means teams like yours are starting to think seriously about [problem your product solves]. Are you currently evaluating options in this space, or is this something on the roadmap?`
        : band === "WARM"
        ? `Hi — I came across ${company} and saw that "${top.sig.detail}". We work with a lot of companies at that stage, and one thing that comes up consistently is [specific pain]. Is that something your team is working through right now?`
        : `Hi — I've had ${company} on my radar for a while. I noticed "${top.sig.detail}" and wanted to reach out while the timing might still be relevant. Happy to share how we've helped similar companies — would that be worth 15 minutes?`,
  };
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
    return buildMockResult(company, score, band, signals);
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-nano-30b-a3b:free",
      max_tokens: 700,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: "You are IntentIQ's AI sales intelligence engine. You analyze B2B purchase intent signals and produce structured, specific, evidence-based analysis for sales reps. You write like a sharp analyst briefing a rep before a call — direct, data-grounded, and conversational. Always respond with valid JSON only. Never use markdown, code blocks, or any text outside the JSON object.",
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

  // If API parsing fails, use the rich mock as fallback rather than a weak hardcoded string
  return buildMockResult(company, score, band, signals);
}
