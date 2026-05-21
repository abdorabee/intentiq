import type { PersonSignalSet, ScoreBand, BuyingStage, UrgencyLevel, ApolloPersonData, BusinessProfile } from "@/lib/types";

export interface PersonReasoningResult {
  ai_summary: string;
  recommended_action: string;
  buying_stage: BuyingStage;
  urgency: UrgencyLevel;
  key_triggers: string[];
  why_now: string;
  approach_angle: string;
  connection_hooks: string[];
  email_subject: string;
  talk_track: string;
}

function buildPersonPrompt(
  person: ApolloPersonData,
  score: number,
  band: ScoreBand,
  signals: PersonSignalSet,
  productCategory: string,
  businessProfile?: BusinessProfile | null
): string {
  const name = person.name ?? ([person.first_name, person.last_name].filter(Boolean).join(" ") || "Unknown");
  const verdict =
    band === "HOT"  ? "a high-priority prospect showing strong buying signals — they are likely in an active evaluation or have the authority and context to engage now" :
    band === "WARM" ? "a promising contact with meaningful signals but not yet in active buying mode" :
                     "a low-priority contact at this time — limited intent signals detected";

  const careerContext = person.employment_history?.length
    ? person.employment_history.slice(0, 3).map((h) =>
        `${h.title} at ${h.organization_name}${h.current ? " (current)" : ""}${h.start_date ? `, started ${h.start_date}` : ""}`
      ).join("\n  ")
    : "No employment history available";

  const sellerContext = businessProfile ? `
ABOUT THE SELLER:
- Product: ${businessProfile.product_category}
- Target Industries: ${businessProfile.target_industries.join(", ")}
- Target Company Size: ${businessProfile.company_size}
- Primary Buyer: ${businessProfile.buyer_role}
- Sales Motion: ${businessProfile.sales_motion}
- Typical Deal: ${businessProfile.deal_size}, cycle: ${businessProfile.sales_cycle}

Tailor your analysis to this seller's ideal customer profile. Make approach recommendations specific to their sales motion and buyer persona.
` : "";

  return `You are IntentIQ's AI sales intelligence engine. You are briefing a sales rep about a SPECIFIC PERSON — not just a company. Your job is to help the rep understand who this person is, why they matter, and exactly how to approach them.

PERSON: ${name}
TITLE: ${person.title ?? "Unknown"}
COMPANY: ${person.organization_name ?? "Unknown"}
SENIORITY: ${person.seniority ?? "Unknown"}
DEPARTMENT: ${person.department ?? "Unknown"}

CAREER HISTORY:
  ${careerContext}

CONTACT INFO:
- Email: ${person.email ?? "Not available"}
- LinkedIn: ${person.linkedin_url ?? "Not available"}
- Phone: ${person.phone ?? "Not available"}

INTENT SCORE: ${score}/100 — ${band}
VERDICT: This person is ${verdict}.
PRODUCT CATEGORY WE SELL: ${productCategory}
${sellerContext}
PERSON SIGNAL DATA:
- Career Change  (30 pts max): ${signals.career_change.score}/${signals.career_change.max} → "${signals.career_change.detail}"
- Seniority Fit  (20 pts max): ${signals.seniority_fit.score}/${signals.seniority_fit.max} → "${signals.seniority_fit.detail}"
- Company Intent (20 pts max): ${signals.company_intent.score}/${signals.company_intent.max} → "${signals.company_intent.detail}"
- News Mentions  (15 pts max): ${signals.news_mentions.score}/${signals.news_mentions.max} → "${signals.news_mentions.detail}"
- Social Presence(15 pts max): ${signals.social_presence.score}/${signals.social_presence.max} → "${signals.social_presence.detail}"

INSTRUCTIONS:
- You are briefing about a PERSON, not a company. Focus on who they are, their career context, and how to approach them individually.
- Be specific. Reference their title, career moves, seniority, and company context.
- The approach_angle should explain the single best way to open a conversation with this specific person — based on their career context and signals.
- connection_hooks should identify 2-3 specific things the rep can reference to build rapport (career moves, shared industry, mutual connections, recent achievements).
- The talk_track must feel personal — like the rep has done their homework on this specific person.

Respond in strict JSON only — no markdown, no code fences, no extra text:
{
  "ai_summary": "4-5 sentences. Lead with who this person is and why they matter as a prospect. Reference their career trajectory and seniority. Connect their personal signals to the company context. Tell the rep what to expect when reaching out to this person specifically.",
  "buying_stage": "awareness|consideration|decision",
  "urgency": "act-now|this-week|this-month|nurture",
  "why_now": "1-2 sentences. Cite the most time-sensitive personal signal — a recent job change, promotion, or news mention. Explain why this creates a window to engage this person NOW.",
  "approach_angle": "2-3 sentences. The single best angle to approach this specific person. Reference their title, career context, or a specific signal. Explain what problem to lead with and why it resonates with someone in their position.",
  "connection_hooks": ["specific thing from their career to reference", "another hook based on their signals or background", "optional third hook"],
  "recommended_action": "One specific, tactical next step for engaging this person. Name the channel (email, LinkedIn, call) and the angle.",
  "email_subject": "Under 55 characters. Reference something specific about this person — their title, company, or a career event.",
  "talk_track": "3-4 sentences written as a natural opening for a conversation with this specific person. Start by referencing something you know about them. Pivot to a problem relevant to someone in their role. End with a soft question.",
  "key_triggers": ["most impactful personal signal", "second most impactful", "third if above 50% of max"]
}`;
}

function buildMockPersonResult(
  person: ApolloPersonData,
  score: number,
  band: ScoreBand,
  signals: PersonSignalSet
): PersonReasoningResult {
  const name = person.name ?? "this contact";
  const title = person.title ?? "Unknown role";
  const company = person.organization_name ?? "Unknown company";

  const ranked = (["career_change", "seniority_fit", "company_intent", "news_mentions", "social_presence"] as const)
    .map((k) => ({ key: k, sig: signals[k], ratio: signals[k].score / signals[k].max }))
    .sort((a, b) => b.ratio - a.ratio);

  const top = ranked[0];
  const second = ranked[1];

  const stageMap: Record<ScoreBand, BuyingStage> = { HOT: "decision", WARM: "consideration", COLD: "awareness" };
  const urgencyMap: Record<ScoreBand, UrgencyLevel> = { HOT: "act-now", WARM: "this-week", COLD: "nurture" };

  const triggers = ranked.filter((r) => r.ratio > 0.5).slice(0, 3).map((r) => r.sig.detail);

  return {
    ai_summary: band === "HOT"
      ? `${name} (${title} at ${company}) is scoring ${score}/100 — a high-priority prospect. Their strongest signal is ${top.key}: "${top.sig.detail}". Combined with ${second.key} data, this person has both the authority and context to engage now. Expect an informed buyer who understands the problem space.`
      : band === "WARM"
      ? `${name} (${title} at ${company}) scores ${score}/100 — a promising contact worth engaging this week. The ${top.key} signal stands out: "${top.sig.detail}". Their ${second.key} signal adds context. This person may not be in active evaluation but is likely open to a well-positioned conversation.`
      : `${name} (${title} at ${company}) scores ${score}/100, reflecting limited intent signals. The strongest signal is ${top.key} at ${Math.round(top.ratio * 100)}%. A nurture approach is recommended — build familiarity now for when signals change.`,
    buying_stage: stageMap[band],
    urgency: urgencyMap[band],
    key_triggers: triggers.length > 0 ? triggers : [top.sig.detail],
    why_now: band === "HOT"
      ? `${name}'s ${top.key} signal just hit high levels: "${top.sig.detail}". This typically means they are actively evaluating or have a mandate to make changes — the window is open.`
      : band === "WARM"
      ? `The ${top.key} signal at "${top.sig.detail}" suggests ${name} is starting to engage with this problem space. Reaching out now positions you before they form vendor opinions.`
      : `No urgent personal trigger exists. Monitor for career changes or company-level signal shifts before investing outreach time.`,
    approach_angle: `Lead with their ${top.key} context: "${top.sig.detail}". As a ${title}, they likely care about [problem your product solves]. Position the conversation around outcomes relevant to someone at their level.`,
    connection_hooks: [
      `Their role as ${title} at ${company}`,
      top.sig.detail,
      second.ratio > 0.3 ? second.sig.detail : `Their ${person.seniority ?? "professional"} background`,
    ],
    recommended_action: band === "HOT"
      ? `Reach out to ${name} today via ${person.linkedin_url ? "LinkedIn" : "email"}. Lead with their ${top.key} signal and ask what initiatives they're driving in their new context.`
      : band === "WARM"
      ? `Send ${name} a targeted ${person.email ? "email" : "LinkedIn message"} this week. Reference their ${top.key} context and share a relevant insight.`
      : `Add ${name} to a nurture sequence. Share valuable content and set alerts for when their signals change.`,
    email_subject: band === "HOT"
      ? `${name.split(" ")[0]} — quick question about ${company}`
      : band === "WARM"
      ? `Noticed your ${top.key.replace("_", " ")} at ${company}`
      : `Keeping ${company} on the radar`,
    talk_track: band === "HOT"
      ? `Hi ${name.split(" ")[0]} — I was looking into ${company} and noticed "${top.sig.detail}". That usually means teams in your position are thinking about [problem]. Are you currently evaluating solutions, or is this on the roadmap?`
      : band === "WARM"
      ? `Hi ${name.split(" ")[0]} — I came across your profile and saw "${top.sig.detail}". We work with a lot of ${title.split(" ")[0]}s at that stage. Is [specific pain] something your team is dealing with?`
      : `Hi ${name.split(" ")[0]} — I've had ${company} on my radar. Given your role as ${title}, I thought you might find value in [insight]. Worth a quick chat?`,
  };
}

const PREMIUM_MODEL = "google/gemini-3.5-flash";
const FREE_MODEL = "google/gemini-3.1-flash-lite";

export async function generatePersonReasoning(
  person: ApolloPersonData,
  score: number,
  band: ScoreBand,
  signals: PersonSignalSet,
  productCategory: string,
  isFirstScore = true,
  businessProfile?: BusinessProfile | null
): Promise<PersonReasoningResult & { model_tier: "premium" | "free" }> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return { ...buildMockPersonResult(person, score, band, signals), model_tier: "free" };
  }

  const model = isFirstScore ? PREMIUM_MODEL : FREE_MODEL;
  const tier = isFirstScore ? "premium" : "free";
  const name = person.name ?? "Unknown";
  console.log(`[person-reasoning] using ${tier} model (${model}) for ${name}`);

  const MAX_RETRIES = 5;
  let res: Response | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: "You are IntentIQ's AI sales intelligence engine. You analyze person-level purchase intent signals and produce structured, specific analysis for sales reps. You brief reps about specific people — their career context, authority level, and how to approach them. Always respond with valid JSON only.",
          },
          { role: "user", content: buildPersonPrompt(person, score, band, signals, productCategory, businessProfile) },
        ],
      }),
    });

    if (res.ok) break;

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = res.headers.get("retry-after");
      const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt + 2) * 1000;
      console.warn(`[person-reasoning] 429 for ${name}, retry ${attempt + 1}/${MAX_RETRIES} in ${(delay / 1000).toFixed(0)}s`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    console.warn(`[person-reasoning] OpenRouter ${res.status} for ${name}, using mock`);
    return { ...buildMockPersonResult(person, score, band, signals), model_tier: "free" };
  }

  if (!res || !res.ok) return { ...buildMockPersonResult(person, score, band, signals), model_tier: "free" };

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const text = data.choices[0]?.message?.content ?? "";

  let parsed: PersonReasoningResult | null = null;
  try {
    parsed = JSON.parse(text) as PersonReasoningResult;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]) as PersonReasoningResult; } catch { /* ignore */ }
    }
  }

  if (parsed) return { ...parsed, model_tier: tier };
  return { ...buildMockPersonResult(person, score, band, signals), model_tier: "free" };
}
