---
type: "query"
date: "2026-05-28T18:08:07.679912+00:00"
question: "Why does createSupabaseAdmin connect REST API routes to billing autopilot watchlist and other communities"
contributor: "graphify"
source_nodes: ["createSupabaseAdmin"]
---

# Q: Why does createSupabaseAdmin connect REST API routes to billing autopilot watchlist and other communities

## Answer

createSupabaseAdmin() is the single service-role Supabase client in lib/supabase.ts. Clerk auth gates requests (auth() in dashboard layout and API routes), then ~116 call sites import and call createSupabaseAdmin() for DB reads/writes across dashboard pages, app/api/* routes, and libs (billing-stats, lists-data, score-service, watchlist-stats, inbox, copilot). The graph bridges communities because one shared data-access primitive fans out to every feature domain—not because routes call each other directly.

## Source Nodes

- createSupabaseAdmin