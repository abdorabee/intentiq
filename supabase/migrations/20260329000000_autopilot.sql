-- ─── Autopilot Workflows ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.autopilot_workflows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  is_enabled    BOOLEAN NOT NULL DEFAULT true,

  -- WATCH: what to monitor
  source_type   TEXT NOT NULL DEFAULT 'watchlist'
                  CHECK (source_type IN ('watchlist', 'specific_domains')),
  source_domains TEXT[],  -- only used when source_type = 'specific_domains'

  -- SCHEDULE
  schedule      TEXT NOT NULL DEFAULT 'daily'
                  CHECK (schedule IN ('daily', 'weekly')),
  next_run_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- DETECT: trigger conditions (stored as JSONB array)
  conditions    JSONB NOT NULL DEFAULT '[]'::jsonb,
  condition_logic TEXT NOT NULL DEFAULT 'any'
                  CHECK (condition_logic IN ('any', 'all')),

  -- ACT: actions to execute when triggered (stored as JSONB array)
  actions       JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  total_runs    INTEGER NOT NULL DEFAULT 0,
  last_run_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_autopilot_workflows_user ON public.autopilot_workflows (user_id, is_enabled);
CREATE INDEX idx_autopilot_workflows_due ON public.autopilot_workflows (next_run_at) WHERE is_enabled = true;

-- ─── Autopilot Runs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.autopilot_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id         UUID NOT NULL REFERENCES public.autopilot_workflows(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'running'
                        CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  companies_checked   INTEGER NOT NULL DEFAULT 0,
  companies_triggered INTEGER NOT NULL DEFAULT 0,
  credits_used        NUMERIC(10,2) NOT NULL DEFAULT 0,
  error_message       TEXT,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_autopilot_runs_workflow ON public.autopilot_runs (workflow_id, started_at DESC);
CREATE INDEX idx_autopilot_runs_user ON public.autopilot_runs (user_id, started_at DESC);

-- ─── Autopilot Actions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.autopilot_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES public.autopilot_runs(id) ON DELETE CASCADE,
  workflow_id     UUID NOT NULL REFERENCES public.autopilot_workflows(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  domain          TEXT NOT NULL,
  company_name    TEXT NOT NULL,

  -- What triggered
  trigger_reason  TEXT NOT NULL,
  old_score       INTEGER,
  new_score       INTEGER,
  old_band        TEXT,
  new_band        TEXT,

  -- What action was taken
  action_type     TEXT NOT NULL
                    CHECK (action_type IN ('email_draft','webhook','slack','pipeline_stage','notification')),
  action_result   JSONB,
  action_status   TEXT NOT NULL DEFAULT 'success'
                    CHECK (action_status IN ('success', 'failed', 'skipped')),

  credits_used    NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_autopilot_actions_run ON public.autopilot_actions (run_id);
CREATE INDEX idx_autopilot_actions_user ON public.autopilot_actions (user_id, created_at DESC);

-- ─── Autopilot credit deduction RPC ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_autopilot_credits(
  p_user_id TEXT,
  p_amount NUMERIC,
  p_reason TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users
  SET credits_remaining = credits_remaining - p_amount
  WHERE id = p_user_id AND credits_remaining >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  INSERT INTO public.credits_log (user_id, amount, type, reason)
  VALUES (p_user_id, p_amount, 'debit', p_reason);
END;
$$;
