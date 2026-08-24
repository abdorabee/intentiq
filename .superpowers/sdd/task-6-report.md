# Phase 6–7 Report — Generative UI + chat UX

**Status:** DONE_WITH_CONCERNS  
**Branch:** `cursor/saas-product-polish-6049`  
**Commit:** `9d7789c` — Add generative UI registry and Score chat workspace controls

## What shipped

Formal `{ type, schema }` registry in `lib/gen-ui.ts`; React `{ render, loading? }` attached in `components/score/gen-ui/workspace.tsx`. New blocks only where tools already return data: `result_list`, `pipeline_summary`, `person_card`, `confirmation`. `blocksFromToolResult` auto-maps those tools (plus `score_company` / `get_company_details` / `present_ui`) so the model does not have to call `present_ui`. `present_ui` allowed types are generated from the registry.

`action_rail` sanitization keeps `prompt` (no longer overwritten with `label`). Unknown payloads are dropped; renderers fall back to one line and are wrapped so a bad block cannot crash the thread.

`chat_messages.ui_blocks` jsonb migration is file-only. Assistant turns persist `ui_blocks` + `tool_calls` / `tool_result`. Session GET selects `ui_blocks`. Score seeds persist the workspace. Score restores the last session from `localStorage` or `GET /api/chat/sessions`.

Chat UX: Stop (AbortController), Retry last user turn, New conversation, image attach via existing multipart API, error row keeps tool chips + Retry, thinking copy is “Working…”. Empty state is domain field + recent scores + one cost line; gradient headline, feature pills, and hot picks are gone.

`add_to_watchlist` and `update_pipeline_stage` no longer mutate in the tool executor. They return a confirmation block; Confirm calls `POST /api/dashboard/watchlist` or `PATCH /api/dashboard/pipeline/stages`. Cancel is local.

OpenRouter token streaming was not added. The tool loop still emits honest `tool_call` / `ui` / `tool_result` / full-turn `text` events.

No CopilotKit. No Chat nav item.

## Files

- `lib/gen-ui.ts` / `lib/gen-ui.test.ts` — registry, new schemas, mapping, prompt preserve
- `lib/chat-client.ts` / `lib/chat-client.test.ts` — abort, multipart, SSE parse, session load
- `lib/copilot.ts` — confirmation-only mutations, registry-driven `present_ui` types
- `lib/types.ts` — `DbChatMessage.ui_blocks`
- `app/api/chat/route.ts` — auto-map, persist blocks/tools
- `app/api/chat/sessions/route.ts` / `[id]/route.ts` — seed + select `ui_blocks`
- `supabase/migrations/20260824000000_chat_ui_blocks.sql`
- `app/(dashboard)/score/score-view.tsx` — stop/retry/attach/restore/quiet empty/confirm
- `components/score/gen-ui/workspace.tsx` — render registry + new blocks
- `app/globals.css` — list/pipeline/confirm/attach, no extra glow

## Tests

```
npx vitest run lib/gen-ui.test.ts lib/chat-client.test.ts
```

Result: **2 files, 22 tests, all passed**.

Covered: unknown types dropped; action_rail prompt preserved; new block schemas; tool-result → block mapping; SSE parse/skip; abort; multipart attach.

Also ran `chat-ui-blocks-migration.test.ts` + product-tour tests (5 files / 36 passed). `tsc` is clean on these files (pre-existing `vesperwise-logo.png` module error remains).

## Concerns

1. **No authenticated browser pass.** Stop/retry/attach/restore/confirm were not exercised as a signed-in user.
2. **`ui_blocks` migration is file-only.** Reload restore 500s until `chat_messages.ui_blocks` exists remotely.
3. **Mutating tools no longer write in `executeTool`.** Confirmation is real only if the user clicks Confirm (dashboard APIs). A model that claims “added” after the pending payload is wrong until confirm.
4. **Token streaming not enabled.** Tool-phase events are honest; text arrives per OpenRouter turn, not per token.
