-- Enable RLS on tables that were missing policies
-- Mirrors the pattern used on scores, watchlist, api_keys, bulk_jobs, etc.

ALTER TABLE public.person_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "person_scores: own rows" ON public.person_scores
  FOR ALL USING (auth.uid()::text = user_id);

ALTER TABLE public.autopilot_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autopilot_workflows: own rows" ON public.autopilot_workflows
  FOR ALL USING (auth.uid()::text = user_id);

ALTER TABLE public.autopilot_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autopilot_runs: own rows" ON public.autopilot_runs
  FOR ALL USING (auth.uid()::text = user_id);

ALTER TABLE public.autopilot_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autopilot_actions: own rows" ON public.autopilot_actions
  FOR ALL USING (auth.uid()::text = user_id);
