// ─── Signal Types ─────────────────────────────────────────────────────────────

export interface SignalResult {
  score: number;
  max: number;
  detail: string;
}

export interface SignalSet {
  funding: SignalResult;
  hiring: SignalResult;
  news: SignalResult;
  technology: SignalResult;
  web: SignalResult;
  latestSignalDate: string; // ISO date string
}

// ─── Score Types ──────────────────────────────────────────────────────────────

export type ScoreBand = "HOT" | "WARM" | "COLD";
export type BuyingStage = "awareness" | "consideration" | "decision";
export type UrgencyLevel = "act-now" | "this-week" | "this-month" | "nurture";

export interface IntentScore {
  company: string;
  domain: string;
  intent_score: number;
  score_band: ScoreBand;
  last_updated: string;
  signals: SignalSet;
  ai_summary: string;
  recommended_action: string;
  buying_stage: BuyingStage;
  urgency: UrgencyLevel;
  key_triggers: string[];
  why_now: string;
  email_subject: string;
  talk_track: string;
  score_decay_date: string;
  model_tier: "premium" | "free";
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ScoreRequest {
  domain?: string;
  company?: string;
}

export interface BulkScoreRequest {
  companies: Array<{ domain?: string; name?: string }>;
  webhook_url?: string;
  callback_id?: string;
}

export interface BulkJobResponse {
  job_id: string;
  estimated_seconds: number;
}

export interface WatchlistEntry {
  id: string;
  user_id: string;
  domain: string;
  company_name: string;
  last_scored: string;
  score: number;
  score_band: ScoreBand;
  is_active: boolean;
  pipeline_stage: PipelineStage;
  stage_changed_at: string;
  previous_score: number | null;
}

// ─── DB Row Types ─────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  lemon_customer_id: string | null;
  lemon_subscription_id: string | null;
  plan: "free" | "starter" | "growth" | "pro" | "agency";
  credits_remaining: number;
  product_category: string | null;
  role: UserRole;
  created_at: string;
}

export interface DbApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  label: string;
  last_used: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbScore {
  id: string;
  user_id: string;
  domain: string;
  company_name: string;
  score: number;
  score_band: ScoreBand;
  signals: SignalSet;
  ai_summary: string;
  recommended_action: string;
  buying_stage: BuyingStage | null;
  urgency: UrgencyLevel | null;
  key_triggers: string[] | null;
  why_now: string | null;
  email_subject: string | null;
  talk_track: string | null;
  expires_at: string;
  created_at: string;
}

export interface DbBulkJob {
  id: string;
  user_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  total: number;
  completed: number;
  webhook_url: string | null;
  results: IntentScore[] | null;
  created_at: string;
}

export interface DbCreditLog {
  id: string;
  user_id: string;
  amount: number;
  type: "debit" | "credit";
  reason: string;
  created_at: string;
}

// ─── Pipeline & Chat Types ───────────────────────────────────────────────────

export type PipelineStage = "cold" | "warming" | "hot" | "engaged" | "converted";
export type UserRole = "sdr" | "ae" | "manager" | "admin";

export interface DbChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls: unknown | null;
  tool_result: unknown | null;
  tokens_used: number;
  created_at: string;
}

export const CHAT_CREDIT_COST = 0.25;

// ─── Plan Config ──────────────────────────────────────────────────────────────

export const PLAN_CREDITS: Record<DbUser["plan"], number> = {
  free: 20,
  starter: 500,
  growth: 2500,
  pro: 8000,
  agency: 25000,
};

export const PLAN_WATCHLIST_LIMIT: Record<DbUser["plan"], number | null> = {
  free: 5,
  starter: 50,
  growth: 250,
  pro: 1000,
  agency: null, // unlimited
};

export const PLAN_RATE_LIMIT: Record<DbUser["plan"], number> = {
  free: 10,
  starter: 100,
  growth: 100,
  pro: 100,
  agency: 100,
};
