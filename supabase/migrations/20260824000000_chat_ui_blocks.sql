-- Persist generative UI blocks so a reloaded chat session can restore the workspace.
alter table public.chat_messages
  add column if not exists ui_blocks jsonb;

comment on column public.chat_messages.ui_blocks is
  'Sanitized generative UI blocks for assistant messages. Reload restores this payload.';
