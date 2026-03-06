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

export interface IntentScore {
  company: string;
  domain: string;
  intent_score: number;
  score_band: ScoreBand;
  last_updated: string;
  signals: SignalSet;
  ai_summary: string;
  recommended_action: string;
  score_decay_date: string;
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
}

// ─── DB Row Types ─────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  plan: "free" | "starter" | "growth" | "pro" | "agency";
  credits_remaining: number;
  product_category: string | null;
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
