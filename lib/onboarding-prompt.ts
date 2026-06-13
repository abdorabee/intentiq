import type { BusinessProfile } from "@/lib/types";

// ─── Tool Definitions (OpenAI-compatible format) ────────────────────────────

export interface OnboardingTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export const ONBOARDING_TOOLS: OnboardingTool[] = [
  {
    type: "function",
    function: {
      name: "present_choices",
      description:
        "Present a question to the user with suggested choices. The message is shown as chat text and the options render as clickable chips. The user may click a chip or type a free-form answer instead.",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The question or message to display to the user",
          },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Suggested answer choices (shown as clickable chips)",
          },
          multi_select: {
            type: "boolean",
            description:
              "If true, the user can select multiple options before continuing. Default false.",
          },
        },
        required: ["message", "options"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_business_profile",
      description:
        "Save the user's business profile once all 7 fields have been gathered. Call this when you have enough information to fill every field.",
      parameters: {
        type: "object",
        properties: {
          product_category: {
            type: "string",
            description:
              'What the company sells. Examples: "SaaS / Software", "Consulting / Services", "Hardware / Physical", "Marketplace / Platform"',
          },
          target_industries: {
            type: "array",
            items: { type: "string" },
            description:
              'Industries they sell into. Examples: "Technology", "Financial Services", "Healthcare", "E-commerce / Retail", "Manufacturing", "Education"',
          },
          company_size: {
            type: "string",
            description:
              'Ideal customer size. Examples: "Startups (1-50)", "SMB (51-200)", "Mid-Market (201-1000)", "Enterprise (1000+)"',
          },
          buyer_role: {
            type: "string",
            description:
              'Primary buyer persona. Examples: "C-Suite / Founders", "VP / Director", "Manager / Team Lead", "Individual Contributor"',
          },
          sales_motion: {
            type: "string",
            description:
              'How they sell. Examples: "Outbound (cold outreach)", "Inbound (content/SEO/ads)", "Product-Led Growth", "Channel / Partners"',
          },
          deal_size: {
            type: "string",
            description:
              'Typical deal value. Examples: "< $5K", "$5K - $25K", "$25K - $100K", "$100K+"',
          },
          sales_cycle: {
            type: "string",
            description:
              'Typical sales cycle length. Examples: "< 2 weeks", "2-4 weeks", "1-3 months", "3+ months"',
          },
        },
        required: [
          "product_category",
          "target_industries",
          "company_size",
          "buyer_role",
          "sales_motion",
          "deal_size",
          "sales_cycle",
        ],
      },
    },
  },
];

// ─── System Prompt ──────────────────────────────────────────────────────────

export const ONBOARDING_SYSTEM_PROMPT = `You are a friendly, knowledgeable B2B sales consultant helping a new user set up their VesperWise account. VesperWise is a sales intelligence platform that scores companies by purchase intent.

Your job is to learn about the user's business through a natural conversation so you can personalize their experience. You need to gather these 7 pieces of information:

1. **product_category** — What they sell (SaaS / Software, Consulting / Services, Hardware / Physical, Marketplace / Platform)
2. **target_industries** — Which industries they sell into (Technology, Financial Services, Healthcare, E-commerce / Retail, Manufacturing, Education, or others)
3. **company_size** — Their ideal customer size (Startups 1-50, SMB 51-200, Mid-Market 201-1000, Enterprise 1000+)
4. **buyer_role** — Who their primary buyer is (C-Suite / Founders, VP / Director, Manager / Team Lead, Individual Contributor)
5. **sales_motion** — How they sell (Outbound, Inbound, Product-Led Growth, Channel / Partners)
6. **deal_size** — Typical deal value (< $5K, $5K-$25K, $25K-$100K, $100K+)
7. **sales_cycle** — How long deals take (< 2 weeks, 2-4 weeks, 1-3 months, 3+ months)

## Rules

- **ALWAYS use the \`present_choices\` tool** when asking a question. Never ask a bare text question without choices.
- Ask ONE question at a time. Don't overwhelm with multiple questions.
- Be conversational and warm but concise — no walls of text. 1-2 sentences per message.
- If the user gives a free-text answer, **infer as many fields as you can** from it. Don't re-ask what's already obvious.
  - Example: "We're a DevOps monitoring SaaS selling to mid-market engineering teams" → you can infer product_category (SaaS / Software), company_size (Mid-Market), and possibly buyer_role and target_industries.
- Adapt your follow-up questions based on what you already know. Skip fields you've already inferred.
- The suggested options in \`present_choices\` should be contextually relevant. You can customize them based on the conversation.
- For target_industries, use multi_select: true since companies often sell across multiple industries.
- Once you have all 7 fields (asked or inferred), call \`save_business_profile\` immediately. Before saving, briefly confirm what you understood in a natural way (e.g., "Great — so you're a SaaS company targeting mid-market healthcare teams...").
- Aim for 4-7 total exchanges. Be efficient.
- Start with a warm greeting and your first question. Something like "Hey! Let's get your account set up. First off — what does your company sell?"
- Do NOT use markdown formatting, bullet lists, or headers in your messages. Keep it conversational plain text.
`;

// ─── Profile Validation Helper ──────────────────────────────────────────────

export function parseBusinessProfile(
  args: Record<string, unknown>
): BusinessProfile | null {
  const p = args as Record<string, unknown>;
  if (
    typeof p.product_category !== "string" ||
    !Array.isArray(p.target_industries) ||
    typeof p.company_size !== "string" ||
    typeof p.buyer_role !== "string" ||
    typeof p.sales_motion !== "string" ||
    typeof p.deal_size !== "string" ||
    typeof p.sales_cycle !== "string"
  ) {
    return null;
  }
  return {
    product_category: p.product_category,
    target_industries: p.target_industries.map(String),
    company_size: p.company_size,
    buyer_role: p.buyer_role,
    sales_motion: p.sales_motion,
    deal_size: p.deal_size,
    sales_cycle: p.sales_cycle,
  };
}
