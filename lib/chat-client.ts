export type ChatSseEvent =
  | { type: "text"; content: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "ui"; blocks: unknown }
  | { type: "done"; session_id: string }
  | { type: "error"; message: string };

export const LAST_CHAT_SESSION_KEY = "vesperwise:last-chat-session";
export const NEW_CHAT_FLAG_KEY = "vesperwise:new-chat";

export type ChatRestoreDecision =
  | { type: "restore"; sessionId: string }
  | { type: "empty" };

export type RetryAction =
  | { kind: "score"; domain: string }
  | { kind: "chat"; text: string };

export function extractDomain(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (!host.includes(".") || host.endsWith(".")) return null;
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)+$/i.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

/** Restore only an explicit last-session id. Never fall back to the latest thread. */
export function resolveChatRestore(input: {
  lastSessionId: string | null | undefined;
  newChatRequested: boolean;
}): ChatRestoreDecision {
  if (input.newChatRequested) return { type: "empty" };
  const sessionId = input.lastSessionId?.trim();
  if (sessionId) return { type: "restore", sessionId };
  return { type: "empty" };
}

/** Accept a bare host or a seeded "Score stripe.com" line used by persisted score turns. */
export function extractRetryDomain(input: string): string | null {
  const direct = extractDomain(input);
  if (direct) return direct;
  const seeded = /^score\s+(\S+)$/i.exec(input.trim());
  return seeded?.[1] ? extractDomain(seeded[1]) : null;
}

export function resolveRetryAction(input: {
  text: string;
  scoreDomain?: string | null;
}): RetryAction {
  const fromText = extractRetryDomain(input.text);
  if (fromText) return { kind: "score", domain: fromText };
  const fallback = input.scoreDomain?.trim();
  if (fallback && /^score\s+/i.test(input.text.trim())) {
    const domain = extractDomain(fallback);
    if (domain) return { kind: "score", domain };
  }
  return { kind: "chat", text: input.text };
}

export function isAbortError(error: unknown): boolean {
  return (error instanceof DOMException && error.name === "AbortError")
    || (error instanceof Error && error.name === "AbortError");
}

export function parseSseBlock(part: string): ChatSseEvent | null {
  const line = part.split("\n").find((entry) => entry.startsWith("data: "));
  if (!line) return null;
  try {
    const event = JSON.parse(line.slice(6)) as ChatSseEvent;
    if (!event || typeof event !== "object" || typeof event.type !== "string") return null;
    return event;
  } catch {
    return null;
  }
}

export type StreamChatBody = {
  message: string;
  session_id?: string;
  image?: File;
};

export async function streamChat(
  body: StreamChatBody,
  onEvent: (event: ChatSseEvent) => void,
  options?: { signal?: AbortSignal },
): Promise<string | undefined> {
  const init: RequestInit = {
    method: "POST",
    signal: options?.signal,
  };

  if (body.image) {
    const form = new FormData();
    form.set("message", body.message);
    if (body.session_id) form.set("session_id", body.session_id);
    form.set("image", body.image);
    init.body = form;
  } else {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify({ message: body.message, session_id: body.session_id });
  }

  const response = await fetch("/api/chat", init);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? "Chat failed");
  }

  if (!response.body) throw new Error("Chat stream unavailable");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sessionId = body.session_id;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const event = parseSseBlock(part);
      if (!event) continue;
      onEvent(event);
      if (event.type === "done") sessionId = event.session_id;
      if (event.type === "error") throw new Error(event.message);
    }
  }

  return sessionId;
}

export async function seedChatSession(opts: {
  sessionId?: string;
  title: string;
  user: string;
  assistant: string;
  ui_blocks?: unknown;
}): Promise<string> {
  const response = await fetch("/api/chat/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: opts.sessionId,
      title: opts.title,
      seed: { user: opts.user, assistant: opts.assistant, ui_blocks: opts.ui_blocks },
    }),
  });
  const payload = await response.json() as { session?: { id: string }; error?: string };
  if (!response.ok || !payload.session?.id) {
    throw new Error(payload.error ?? "Failed to start chat session");
  }
  return payload.session.id;
}

export type ChatSessionSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type PersistedChatMessage = {
  id: string;
  role: string;
  content: string;
  tool_calls: unknown;
  tool_result: unknown;
  ui_blocks?: unknown;
  created_at: string;
};

export async function listChatSessions(): Promise<ChatSessionSummary[]> {
  const response = await fetch("/api/chat/sessions");
  const payload = await response.json() as { sessions?: ChatSessionSummary[]; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Failed to load sessions");
  return payload.sessions ?? [];
}

export async function loadChatSession(id: string): Promise<{
  session: { id: string; title: string };
  messages: PersistedChatMessage[];
}> {
  const response = await fetch(`/api/chat/sessions/${id}`);
  const payload = await response.json() as {
    session?: { id: string; title: string };
    messages?: PersistedChatMessage[];
    error?: string;
  };
  if (!response.ok || !payload.session) {
    throw new Error(payload.error ?? "Failed to load session");
  }
  return { session: payload.session, messages: payload.messages ?? [] };
}

export async function persistChatUiBlocks(opts: {
  sessionId: string;
  messageId?: string;
  ui_blocks: unknown;
}): Promise<void> {
  const response = await fetch(`/api/chat/sessions/${opts.sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message_id: opts.messageId,
      ui_blocks: opts.ui_blocks,
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? "Failed to persist UI");
  }
}
