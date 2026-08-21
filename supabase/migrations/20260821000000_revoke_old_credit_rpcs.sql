-- Revoke public execute on legacy credit RPCs that are still in use but should
-- not be callable by anon/authenticated roles. These functions are SECURITY
-- DEFINER and must only be called by service_role via the API routes.

-- The v2 scoring pipeline (begin_score_run, complete_score_run, fail_score_run)
-- was already properly locked down in 20260715000000_scoring_v2_pipeline.sql.
-- These older functions were not revoked at that time.

revoke all on function public.deduct_credit(text) from public;
revoke all on function public.deduct_credit(text) from anon, authenticated;
grant execute on function public.deduct_credit(text) to service_role;

revoke all on function public.increment_credits(text, numeric) from public;
revoke all on function public.increment_credits(text, numeric) from anon, authenticated;
grant execute on function public.increment_credits(text, numeric) to service_role;

revoke all on function public.deduct_chat_credit(text, numeric) from public;
revoke all on function public.deduct_chat_credit(text, numeric) from anon, authenticated;
grant execute on function public.deduct_chat_credit(text, numeric) to service_role;
