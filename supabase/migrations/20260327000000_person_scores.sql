-- Person intent scores table (parallel to company scores)
CREATE TABLE IF NOT EXISTS person_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_name       TEXT NOT NULL,
  person_email      TEXT,
  person_linkedin   TEXT,
  person_title      TEXT,
  person_company    TEXT,
  person_domain     TEXT,
  person_seniority  TEXT,
  score             INTEGER NOT NULL,
  score_band        TEXT NOT NULL CHECK (score_band IN ('HOT','WARM','COLD')),
  signals           JSONB NOT NULL,
  ai_summary        TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  buying_stage      TEXT,
  urgency           TEXT,
  key_triggers      JSONB,
  why_now           TEXT,
  approach_angle    TEXT,
  connection_hooks  JSONB,
  email_subject     TEXT,
  talk_track        TEXT,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON person_scores (user_id, created_at DESC);
CREATE INDEX ON person_scores (person_email, created_at DESC);
CREATE INDEX ON person_scores (person_linkedin, created_at DESC);
