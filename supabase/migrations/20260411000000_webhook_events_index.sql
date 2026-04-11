-- Index on processed_webhook_events(created_at) for efficient TTL cleanup queries
CREATE INDEX IF NOT EXISTS processed_webhook_events_created_at_idx
  ON public.processed_webhook_events (created_at);
