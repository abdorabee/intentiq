CREATE TABLE IF NOT EXISTS public.inbox_notifications (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        text        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type     text        NOT NULL,
  domain         text        NOT NULL,
  company_name   text        NOT NULL,
  title          text        NOT NULL,
  summary        text        NOT NULL,
  metadata       jsonb       DEFAULT '{}'::jsonb,
  tags           text[]      DEFAULT '{}',
  list_id        uuid        REFERENCES public.lists(id) ON DELETE SET NULL,
  is_read        boolean     NOT NULL DEFAULT false,
  is_archived    boolean     NOT NULL DEFAULT false,
  is_snoozed     boolean     NOT NULL DEFAULT false,
  snoozed_until  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inbox_user_created_idx ON public.inbox_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inbox_user_read_idx    ON public.inbox_notifications (user_id, is_read, is_archived);

ALTER TABLE public.inbox_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications"
  ON public.inbox_notifications FOR ALL
  USING (auth.uid()::text = user_id);
