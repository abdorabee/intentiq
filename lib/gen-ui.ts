import { z } from "zod";
import type { ScoreBand, SignalSet } from "@/lib/types";

const scoreBandSchema = z.enum(["HOT", "WARM", "COLD"]);

const suggestionSchema = z.object({
  label: z.string().min(1).max(80),
  prompt: z.string().min(1).max(280),
});

export const signalAxisSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(40),
  score: z.number(),
  max: z.number().positive(),
  detail: z.string().max(2000).optional(),
  observed_at: z.string().max(80).nullable().optional(),
  source: z.string().max(80).optional(),
  context: z.boolean().optional(),
});

const intentHeroSchema = z.object({
  type: z.literal("intent_hero"),
  company: z.string().min(1).max(120),
  domain: z.string().min(1).max(200),
  intent_score: z.number(),
  score_band: scoreBandSchema,
  buying_stage: z.string().max(40).optional(),
  urgency: z.string().max(40).optional(),
  data_coverage: z.number().optional(),
  score_status: z.string().max(40).optional(),
  icp_fit_score: z.number().nullable().optional(),
});

const signalExplorerSchema = z.object({
  type: z.literal("signal_explorer"),
  selected_key: z.string().max(40).optional(),
  axes: z.array(signalAxisSchema).min(1).max(8),
});

const thesisSchema = z.object({
  type: z.literal("thesis"),
  summary: z.string().min(1).max(4000),
  urgency: z.string().max(40).optional(),
  recommended_action: z.string().max(500).optional(),
  why_now: z.string().max(2000).optional(),
});

const outreachStudioSchema = z.object({
  type: z.literal("outreach_studio"),
  company: z.string().max(120).optional(),
  subject: z.string().max(200).optional(),
  talk_track: z.string().max(4000).optional(),
});

const actionRailSchema = z.object({
  type: z.literal("action_rail"),
  company: z.string().min(1).max(120),
  domain: z.string().min(1).max(200),
  suggestions: z.array(suggestionSchema).max(6).optional(),
});

const comparisonAccountSchema = z.object({
  company: z.string().min(1).max(120),
  domain: z.string().min(1).max(200),
  intent_score: z.number(),
  score_band: scoreBandSchema,
  axes: z.array(z.object({
    key: z.string().min(1).max(40),
    score: z.number(),
    max: z.number().positive(),
  })).max(6).optional(),
});

const comparisonSchema = z.object({
  type: z.literal("comparison"),
  accounts: z.array(comparisonAccountSchema).min(2).max(4),
});

const markdownSchema = z.object({
  type: z.literal("markdown"),
  text: z.string().min(1).max(4000),
});

const resultListItemSchema = z.object({
  company: z.string().min(1).max(120),
  domain: z.string().min(1).max(200),
  intent_score: z.number().nullable().optional(),
  score_band: scoreBandSchema.nullable().optional(),
});

const resultListSchema = z.object({
  type: z.literal("result_list"),
  query: z.string().max(200).optional(),
  items: z.array(resultListItemSchema).max(20),
  empty_message: z.string().max(200).optional(),
});

const pipelineCompanySchema = z.object({
  company: z.string().min(1).max(120),
  domain: z.string().min(1).max(200),
  score: z.number().nullable().optional(),
});

const pipelineStageSchema = z.object({
  stage: z.string().min(1).max(40),
  count: z.number(),
  companies: z.array(pipelineCompanySchema).max(10),
});

const pipelineSummarySchema = z.object({
  type: z.literal("pipeline_summary"),
  total: z.number(),
  stages: z.array(pipelineStageSchema).max(8),
  empty_message: z.string().max(200).optional(),
});

const personCardSchema = z.object({
  type: z.literal("person_card"),
  name: z.string().min(1).max(120),
  title: z.string().max(160).nullable().optional(),
  company: z.string().max(120).nullable().optional(),
  intent_score: z.number(),
  score_band: scoreBandSchema,
  summary: z.string().max(4000).optional(),
  recommended_action: z.string().max(500).optional(),
  approach_angle: z.string().max(500).optional(),
  buying_stage: z.string().max(40).optional(),
  urgency: z.string().max(40).optional(),
});

const confirmationActionSchema = z.enum(["add_to_watchlist", "update_pipeline_stage"]);

const confirmationSchema = z.object({
  type: z.literal("confirmation"),
  action: confirmationActionSchema,
  title: z.string().min(1).max(120),
  description: z.string().max(400),
  confirm_label: z.string().max(40).optional(),
  cancel_label: z.string().max(40).optional(),
  domain: z.string().min(1).max(200),
  company: z.string().max(120).optional(),
  stage: z.string().max(40).optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "error"]).optional(),
});

export const UI_BLOCK_SCHEMA_BY_TYPE = {
  intent_hero: intentHeroSchema,
  signal_explorer: signalExplorerSchema,
  thesis: thesisSchema,
  outreach_studio: outreachStudioSchema,
  action_rail: actionRailSchema,
  comparison: comparisonSchema,
  markdown: markdownSchema,
  result_list: resultListSchema,
  pipeline_summary: pipelineSummarySchema,
  person_card: personCardSchema,
  confirmation: confirmationSchema,
} as const;

export type UiBlockType = keyof typeof UI_BLOCK_SCHEMA_BY_TYPE;

export const UI_BLOCK_TYPES = Object.keys(UI_BLOCK_SCHEMA_BY_TYPE) as UiBlockType[];

export type UiBlockDef<T extends UiBlockType = UiBlockType> = {
  type: T;
  schema: (typeof UI_BLOCK_SCHEMA_BY_TYPE)[T];
};

export const UI_BLOCK_REGISTRY = Object.fromEntries(
  UI_BLOCK_TYPES.map((type) => [type, { type, schema: UI_BLOCK_SCHEMA_BY_TYPE[type] }]),
) as { [K in UiBlockType]: UiBlockDef<K> };

export const uiBlockSchema = z.discriminatedUnion("type", [
  intentHeroSchema,
  signalExplorerSchema,
  thesisSchema,
  outreachStudioSchema,
  actionRailSchema,
  comparisonSchema,
  markdownSchema,
  resultListSchema,
  pipelineSummarySchema,
  personCardSchema,
  confirmationSchema,
]);

export const uiBlockListSchema = z.array(uiBlockSchema).max(12);

export type UiBlock = z.infer<typeof uiBlockSchema>;
export type SignalAxis = z.infer<typeof signalAxisSchema>;
export type UiSuggestion = z.infer<typeof suggestionSchema>;
export type ConfirmationBlock = Extract<UiBlock, { type: "confirmation" }>;

export function presentUiAllowedTypes(): UiBlockType[] {
  return UI_BLOCK_TYPES.slice();
}

const AXIS_META: Record<string, { label: string; context?: boolean }> = {
  funding: { label: "Funding" },
  hiring: { label: "Hiring" },
  news: { label: "News" },
  technology: { label: "Tech" },
  web: { label: "Web authority", context: true },
  github: { label: "GitHub activity", context: true },
};

export function signalAxesFromSet(signals: SignalSet): SignalAxis[] {
  const keys = ["funding", "hiring", "news", "technology", "web", "github"] as const;
  return keys.flatMap((key) => {
    const sig = signals[key];
    if (!sig) return [];
    const meta = AXIS_META[key];
    return [{
      key,
      label: meta.label,
      score: sig.score,
      max: sig.max,
      detail: sig.detail,
      observed_at: sig.observed_at ?? null,
      source: sig.source,
      context: meta.context,
    }];
  });
}

export type WorkspaceScore = {
  company: string;
  domain: string;
  intent_score: number;
  score_band: ScoreBand;
  ai_summary?: string;
  recommended_action?: string;
  buying_stage?: string;
  urgency?: string;
  why_now?: string;
  data_coverage?: number;
  score_status?: string;
  icp_fit_score?: number | null;
  email_subject?: string;
  talk_track?: string;
  signals?: SignalSet;
};

export function defaultSuggestions(score: { company: string; score_band: string }): UiSuggestion[] {
  return [
    {
      label: `Why ${score.score_band}?`,
      prompt: `Why is ${score.company} ${score.score_band}? What evidence matters most, and what would move the score?`,
    },
    {
      label: "Draft outreach",
      prompt: `Draft a personalized outreach email for ${score.company}`,
    },
    {
      label: "Who to call",
      prompt: `Who should I talk to at ${score.company} and what's the angle?`,
    },
  ];
}

export function workspaceFromScore(score: WorkspaceScore): UiBlock[] {
  const blocks: UiBlock[] = [
    {
      type: "intent_hero",
      company: score.company,
      domain: score.domain,
      intent_score: score.intent_score,
      score_band: score.score_band,
      buying_stage: score.buying_stage,
      urgency: score.urgency,
      data_coverage: score.data_coverage,
      score_status: score.score_status,
      icp_fit_score: score.icp_fit_score,
    },
  ];

  if (score.signals) {
    const axes = signalAxesFromSet(score.signals);
    if (axes.length > 0) {
      const weakest = axes
        .filter((a) => !a.context)
        .slice()
        .sort((a, b) => a.score / a.max - b.score / b.max)[0];
      blocks.push({
        type: "signal_explorer",
        selected_key: weakest?.key,
        axes,
      });
    }
  }

  if (score.ai_summary) {
    blocks.push({
      type: "thesis",
      summary: score.ai_summary,
      urgency: score.urgency,
      recommended_action: score.recommended_action,
      why_now: score.why_now,
    });
  }

  if (score.email_subject || score.talk_track) {
    blocks.push({
      type: "outreach_studio",
      company: score.company,
      subject: score.email_subject,
      talk_track: score.talk_track,
    });
  }

  blocks.push({
    type: "action_rail",
    company: score.company,
    domain: score.domain,
    suggestions: defaultSuggestions(score),
  });

  return blocks;
}

function extractBlocksInput(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (Array.isArray(record.blocks)) return record.blocks;
  }
  return [];
}

function domainOf(block: UiBlock): string | undefined {
  if (block.type === "intent_hero" || block.type === "action_rail") return block.domain.toLowerCase();
  return undefined;
}

export function sanitizeUiBlocks(input: unknown, allowedDomains?: string[]): UiBlock[] {
  const allowed = allowedDomains?.map((d) => d.toLowerCase());
  const out: UiBlock[] = [];

  for (const item of extractBlocksInput(input)) {
    const parsed = uiBlockSchema.safeParse(item);
    if (!parsed.success) continue;
    let block = parsed.data;

    if (allowed && allowed.length > 0) {
      const domain = domainOf(block);
      if (domain && !allowed.includes(domain)) continue;
      if (block.type === "comparison") {
        const accounts = block.accounts.filter((a) => allowed.includes(a.domain.toLowerCase()));
        if (accounts.length < 2) continue;
        block = { ...block, accounts };
      }
    }

    out.push(block);
    if (out.length >= 12) break;
  }

  return out;
}

export function suggestionsFromBlocks(blocks: UiBlock[]): UiSuggestion[] {
  const rail = [...blocks].reverse().find((b) => b.type === "action_rail");
  return rail?.type === "action_rail" ? rail.suggestions ?? [] : [];
}

export function workspaceScoreFromUnknown(result: unknown): WorkspaceScore | null {
  if (!result || typeof result !== "object") return null;
  const row = result as Record<string, unknown>;
  if (typeof row.error === "string") return null;
  const intent =
    typeof row.intent_score === "number" ? row.intent_score
    : typeof row.score === "number" ? row.score
    : null;
  const band = row.score_band;
  const company = typeof row.company === "string" ? row.company : null;
  const domain = typeof row.domain === "string" ? row.domain : null;
  if (intent == null || (band !== "HOT" && band !== "WARM" && band !== "COLD") || !company || !domain) {
    return null;
  }
  return {
    company,
    domain,
    intent_score: intent,
    score_band: band,
    ai_summary: typeof row.ai_summary === "string" ? row.ai_summary : undefined,
    recommended_action: typeof row.recommended_action === "string" ? row.recommended_action : undefined,
    buying_stage: typeof row.buying_stage === "string" ? row.buying_stage : undefined,
    urgency: typeof row.urgency === "string" ? row.urgency : undefined,
    why_now: typeof row.why_now === "string" ? row.why_now : undefined,
    email_subject: typeof row.email_subject === "string" ? row.email_subject : undefined,
    talk_track: typeof row.talk_track === "string" ? row.talk_track : undefined,
    signals: row.signals && typeof row.signals === "object" ? row.signals as SignalSet : undefined,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function mapSearchResults(result: Record<string, unknown>): unknown {
  const rows = Array.isArray(result.results) ? result.results : [];
  const items = rows.flatMap((row) => {
    const item = asRecord(row);
    if (!item) return [];
    const company = typeof item.company_name === "string" ? item.company_name
      : typeof item.company === "string" ? item.company
      : null;
    const domain = typeof item.domain === "string" ? item.domain : null;
    if (!company || !domain) return [];
    return [{
      company,
      domain,
      intent_score: typeof item.score === "number" ? item.score
        : typeof item.intent_score === "number" ? item.intent_score
        : null,
      score_band: item.score_band === "HOT" || item.score_band === "WARM" || item.score_band === "COLD"
        ? item.score_band
        : null,
    }];
  });
  return {
    type: "result_list",
    query: typeof result.query === "string" ? result.query : undefined,
    items,
    empty_message: items.length === 0
      ? (typeof result.message === "string" ? result.message : "No matching accounts.")
      : undefined,
  };
}

const PIPELINE_STAGE_ORDER = ["hot", "warming", "engaged", "converted", "cold"];

function mapPipelineSummary(result: Record<string, unknown>): unknown {
  const top = asRecord(result.top_per_stage) ?? asRecord(result.stages) ?? {};
  const counts = asRecord(result.counts) ?? {};
  const stageNames = [...new Set([
    ...PIPELINE_STAGE_ORDER,
    ...Object.keys(top),
    ...Object.keys(counts),
  ])];
  const stages = stageNames.flatMap((stage) => {
    const raw = top[stage];
    const companies = Array.isArray(raw) ? raw.flatMap((row) => {
      const item = asRecord(row);
      if (!item) return [];
      const company = typeof item.company_name === "string" ? item.company_name
        : typeof item.company === "string" ? item.company
        : null;
      const domain = typeof item.domain === "string" ? item.domain : null;
      if (!company || !domain) return [];
      return [{
        company,
        domain,
        score: typeof item.score === "number" ? item.score : null,
      }];
    }).slice(0, 10) : [];
    const count = typeof counts[stage] === "number" ? counts[stage] : companies.length;
    if (count === 0 && companies.length === 0) return [];
    return [{ stage, count, companies }];
  });
  const total = typeof result.total === "number" ? result.total : stages.reduce((sum, s) => sum + s.count, 0);
  return {
    type: "pipeline_summary",
    total,
    stages,
    empty_message: total === 0
      ? (typeof result.message === "string" ? result.message : "No companies in pipeline.")
      : undefined,
  };
}

function mapPersonCard(result: Record<string, unknown>): unknown {
  const name = typeof result.person_name === "string" ? result.person_name : null;
  const intent = typeof result.intent_score === "number" ? result.intent_score : null;
  const band = result.score_band;
  if (!name || intent == null || (band !== "HOT" && band !== "WARM" && band !== "COLD")) return null;
  return {
    type: "person_card",
    name,
    title: typeof result.person_title === "string" ? result.person_title : null,
    company: typeof result.person_company === "string" ? result.person_company : null,
    intent_score: intent,
    score_band: band,
    summary: typeof result.ai_summary === "string" ? result.ai_summary : undefined,
    recommended_action: typeof result.recommended_action === "string" ? result.recommended_action : undefined,
    approach_angle: typeof result.approach_angle === "string" ? result.approach_angle : undefined,
    buying_stage: typeof result.buying_stage === "string" ? result.buying_stage : undefined,
    urgency: typeof result.urgency === "string" ? result.urgency : undefined,
  };
}

function mapConfirmation(name: string, result: Record<string, unknown>): unknown {
  const action = result.action === "add_to_watchlist" || result.action === "update_pipeline_stage"
    ? result.action
    : name === "add_to_watchlist" || name === "update_pipeline_stage"
      ? name
      : null;
  const domain = typeof result.domain === "string" ? result.domain : null;
  if (!action || !domain) return null;
  const company = typeof result.company_name === "string" ? result.company_name
    : typeof result.company === "string" ? result.company
    : undefined;
  const stage = typeof result.stage === "string" ? result.stage : undefined;
  if (action === "add_to_watchlist") {
    return {
      type: "confirmation",
      action,
      title: "Add to watchlist",
      description: typeof result.message === "string"
        ? result.message
        : `Add ${company ?? domain} to your watchlist?`,
      confirm_label: "Add",
      cancel_label: "Cancel",
      domain,
      company,
      status: result.needs_confirmation === false && result.success === true ? "confirmed" : "pending",
    };
  }
  return {
    type: "confirmation",
    action,
    title: "Update pipeline stage",
    description: typeof result.message === "string"
      ? result.message
      : `Move ${domain} to ${stage ?? "the next stage"}?`,
    confirm_label: "Update",
    cancel_label: "Cancel",
    domain,
    company,
    stage,
    status: result.needs_confirmation === false && result.success === true ? "confirmed" : "pending",
  };
}

export function blocksFromToolResult(name: string, result: unknown): UiBlock[] {
  if (!result || typeof result !== "object") return [];
  const row = result as Record<string, unknown>;
  if (typeof row.error === "string") return [];

  switch (name) {
    case "present_ui":
      return sanitizeUiBlocks(row.blocks ?? result);
    case "score_company":
    case "get_company_details": {
      const score = workspaceScoreFromUnknown(result);
      return score ? workspaceFromScore(score) : [];
    }
    case "search_scored_companies":
      return sanitizeUiBlocks([mapSearchResults(row)]);
    case "get_pipeline_summary":
      return sanitizeUiBlocks([mapPipelineSummary(row)]);
    case "score_person": {
      const card = mapPersonCard(row);
      return card ? sanitizeUiBlocks([card]) : [];
    }
    case "add_to_watchlist":
    case "update_pipeline_stage": {
      const block = mapConfirmation(name, row);
      return block ? sanitizeUiBlocks([block]) : [];
    }
    default:
      return [];
  }
}
