"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatMessage, { type ChatMessageData } from "./chat-message";
import ChatInput from "./chat-input";

interface Session {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRemaining: number;
  /** Full-width in-page layout (no overlay / fixed drawer) */
  embedded?: boolean;
}

export default function ChatPanel({ isOpen, onClose, creditsRemaining, embedded = false }: ChatPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [credits, setCredits] = useState(creditsRemaining);

  useEffect(() => {
    setCredits(creditsRemaining);
  }, [creditsRemaining]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load sessions when panel opens
  useEffect(() => {
    if (isOpen || embedded) {
      fetchSessions();
    }
  }, [isOpen, embedded]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch { /* ignore */ }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`);
      const data = await res.json();
      setActiveSessionId(sessionId);
      setMessages(
        (data.messages ?? []).map((m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
      setShowSessions(false);
    } catch { /* ignore */ }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch { /* ignore */ }
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setShowSessions(false);
  };

  const handleSend = useCallback(async (content: string) => {
    const userMsg: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessageData = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolCalls: [],
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, session_id: activeSessionId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: err.error ?? "Error occurred", isStreaming: false } : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + event.content } : m
                )
              );
            } else if (event.type === "tool_call") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, toolCalls: [...(m.toolCalls ?? []), { name: event.name, args: event.args }] }
                    : m
                )
              );
            } else if (event.type === "tool_result") {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  const calls = [...(m.toolCalls ?? [])];
                  const idx = calls.findLastIndex((c) => c.name === event.name && !c.result);
                  if (idx >= 0) calls[idx] = { ...calls[idx], result: event.result };
                  return { ...m, toolCalls: calls };
                })
              );
            } else if (event.type === "done") {
              if (event.session_id && !activeSessionId) {
                setActiveSessionId(event.session_id);
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, isStreaming: false } : m
                )
              );
              // Refresh sessions list
              fetchSessions();
              // Deduct credit locally
              setCredits((c) => Math.max(0, c - 0.25));
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + "\n\n" + event.message, isStreaming: false } : m
                )
              );
            }
          } catch { /* skip malformed events */ }
        }
      }

      // Ensure streaming flag is cleared
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: "Connection error. Please try again.", isStreaming: false } : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [activeSessionId]);

  if (!embedded && !isOpen) return null;

  return (
    <>
      {!embedded ? (
        <div className="fixed inset-0 z-40 bg-black/40 lg:bg-transparent" onClick={onClose} />
      ) : null}

      {/* Panel */}
      <div
        className={
          embedded
            ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#0e1011] font-mono"
            : "fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white sm:w-[420px] lg:w-[440px] dark:border-white/[0.06] dark:bg-black"
        }
        style={embedded ? undefined : { fontFamily: "var(--font-jetbrains), monospace" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[0.15em] text-[#c9c4ff]">COPILOT</span>
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-1"
              aria-label="Toggle sessions"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={startNewChat}
              className="cursor-pointer p-1 text-slate-500 transition-colors hover:text-[#c9c4ff]"
              aria-label="New chat"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-600 tracking-[0.1em]">
              {credits} cr
            </span>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Session list (collapsible) */}
        {showSessions && (
          <div className="border-b border-slate-200 dark:border-white/[0.06] max-h-48 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-slate-600 text-[11px] text-center py-4">No previous chats</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors text-[11px]",
                    s.id === activeSessionId
                      ? "border-l-2 border-[#7170ff] bg-[#5e6ad2]/10 text-[#c9c4ff]"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.02] border-l-2 border-transparent"
                  )}
                >
                  <span className="truncate flex-1">{s.title}</span>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="shrink-0 ml-2 text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                    aria-label="Delete session"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#5e6ad2]/25 bg-[#5e6ad2]/10">
                <span className="text-lg text-[#c9c4ff]">?</span>
              </div>
              <div>
                <p className="text-slate-700 dark:text-slate-300 text-sm mb-1">Intent Copilot</p>
                <p className="text-slate-400 dark:text-slate-600 text-[11px] max-w-[280px]">
                  Ask about your pipeline, get company briefs, draft outreach, or score new companies.
                </p>
              </div>
              <div className="space-y-1.5 w-full max-w-[280px]">
                {[
                  "Which of my leads are hottest right now?",
                  "Brief me on stripe.com",
                  "Draft an email for my top lead",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={isStreaming || credits < 0.25}
                    className="w-full text-left px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer disabled:opacity-30"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          creditsRemaining={credits}
        />
      </div>
    </>
  );
}
