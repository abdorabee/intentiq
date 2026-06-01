"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowUp, Sparkles, ArrowRight, Check } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  choices?: {
    options: string[];
    multiSelect: boolean;
  };
}

// ─── Typing Indicator ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-cyan-400"
          style={{
            animation: "thinking-dot 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Choice Chip ────────────────────────────────────────────────────────────

function ChoiceChip({
  label,
  selected,
  onClick,
  delay: animDelay,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  delay: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 text-[12px] rounded-full border transition-all duration-200 cursor-pointer
        opacity-0 animate-fade-in
        ${
          selected
            ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
            : "bg-foreground/[0.02] border-foreground/[0.1] text-slate-300 hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-cyan-200"
        }
      `}
      style={{
        animationDelay: `${animDelay}ms`,
        animationFillMode: "forwards",
      }}
    >
      <span className="flex items-center gap-1.5">
        {label}
        {selected && <Check className="w-3 h-3 text-cyan-400" />}
      </span>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }, []);

  // ── Send message to API ─────────────────────────────────────────────────

  const sendToApi = useCallback(
    async (allMessages: Message[]) => {
      setIsStreaming(true);
      scrollToBottom();

      // Prepare conversation for API — only role + content, no choices
      const apiMessages = allMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const assistantId = `assistant-${Date.now()}`;

      try {
        const res = await fetch("/api/onboarding/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: err.error ?? "Something went wrong. Please try again.",
            },
          ]);
          setIsStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentText = "";
        let pendingChoices: { options: string[]; multiSelect: boolean } | null =
          null;

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
                currentText += event.content;
                // Update or create the assistant message
                setMessages((prev) => {
                  const existing = prev.find((m) => m.id === assistantId);
                  if (existing) {
                    return prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: currentText }
                        : m
                    );
                  }
                  return [
                    ...prev,
                    { id: assistantId, role: "assistant", content: currentText },
                  ];
                });
                scrollToBottom();
              } else if (event.type === "choices") {
                // The choices tool sends message + options
                const choiceText = event.message as string;
                pendingChoices = {
                  options: event.options as string[],
                  multiSelect: event.multi_select as boolean,
                };
                const fullContent = currentText
                  ? currentText + "\n\n" + choiceText
                  : choiceText;
                currentText = fullContent;

                setMessages((prev) => {
                  const existing = prev.find((m) => m.id === assistantId);
                  if (existing) {
                    return prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent, choices: pendingChoices! }
                        : m
                    );
                  }
                  return [
                    ...prev,
                    {
                      id: assistantId,
                      role: "assistant",
                      content: fullContent,
                      choices: pendingChoices!,
                    },
                  ];
                });
                scrollToBottom();
              } else if (event.type === "done") {
                setIsComplete(
                  // Check if save_business_profile was called by seeing if there's no choices on the last message
                  !pendingChoices
                );
                // If profile was saved (no pending choices and we got done), redirect
                if (!pendingChoices) {
                  // The AI has finished and saved the profile
                  setTimeout(() => {
                    window.location.href = "/dashboard";
                  }, 2500);
                }
              } else if (event.type === "error") {
                setMessages((prev) => {
                  const existing = prev.find((m) => m.id === assistantId);
                  if (existing) {
                    return prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content:
                              m.content +
                              "\n\n" +
                              (event.message as string),
                          }
                        : m
                    );
                  }
                  return [
                    ...prev,
                    {
                      id: assistantId,
                      role: "assistant",
                      content: event.message as string,
                    },
                  ];
                });
              }
            } catch {
              /* skip malformed events */
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "Connection error. Please refresh and try again.",
          },
        ]);
      } finally {
        setIsStreaming(false);
        scrollToBottom();
      }
    },
    [scrollToBottom]
  );

  // ── Initial greeting ────────────────────────────────────────────────────

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Small delay for welcome animation, then trigger the AI
    const timer = setTimeout(() => {
      setShowWelcome(false);
      sendToApi([]);
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle user sending a message ───────────────────────────────────────

  const handleSend = useCallback(
    (content: string) => {
      if (!content.trim() || isStreaming || isComplete) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
      };

      // Clear choices from the last assistant message
      const updatedMessages = messages.map((m) =>
        m.choices ? { ...m, choices: undefined } : m
      );
      const newMessages = [...updatedMessages, userMsg];
      setMessages(newMessages);
      setInputValue("");
      setMultiSelections([]);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      scrollToBottom();
      sendToApi(newMessages);
    },
    [messages, isStreaming, isComplete, scrollToBottom, sendToApi]
  );

  // ── Handle single-select choice click ───────────────────────────────────

  const handleChoiceClick = useCallback(
    (option: string) => {
      if (isStreaming || isComplete) return;
      handleSend(option);
    },
    [isStreaming, isComplete, handleSend]
  );

  // ── Handle multi-select toggle ──────────────────────────────────────────

  const handleMultiToggle = useCallback((option: string) => {
    setMultiSelections((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  }, []);

  const handleMultiConfirm = useCallback(() => {
    if (multiSelections.length === 0) return;
    handleSend(multiSelections.join(", "));
  }, [multiSelections, handleSend]);

  // ── Textarea auto-resize ────────────────────────────────────────────────

  const handleTextareaInput = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(inputValue);
      }
    },
    [inputValue, handleSend]
  );

  // Find the last assistant message with active choices
  const activeChoicesMsg = messages.find(
    (m) => m.role === "assistant" && m.choices
  );

  return (
    <div
      className="min-h-screen bg-white dark:bg-black flex flex-col"
      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
    >
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-foreground/[0.06] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-cyan-600 dark:text-cyan-400 text-xs tracking-[0.2em] font-bold">
            [ INTENT IQ ]
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            {isComplete ? "All set!" : "Setting up your profile"}
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
          {/* Welcome splash — shows briefly before first AI message */}
          {showWelcome && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
                <Sparkles className="w-7 h-7 text-cyan-400" />
              </div>
              <h2 className="text-lg text-slate-800 dark:text-slate-100 font-medium mb-2">
                Let&apos;s set up your account
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center max-w-xs">
                I&apos;ll ask a few questions to personalize your experience
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
            >
              {msg.role === "assistant" ? (
                <div className="max-w-[90%] space-y-3">
                  {/* Message bubble */}
                  <div className="bg-slate-50 dark:bg-foreground/[0.03] border border-slate-200 dark:border-foreground/[0.06] rounded-2xl px-5 py-3.5">
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>

                  {/* Choice chips — only show for the message with active choices */}
                  {msg.choices &&
                    msg === activeChoicesMsg &&
                    !isStreaming && (
                      <div className="space-y-2.5 pl-1">
                        <div className="flex flex-wrap gap-2">
                          {msg.choices.options.map((opt, i) =>
                            msg.choices!.multiSelect ? (
                              <ChoiceChip
                                key={opt}
                                label={opt}
                                selected={multiSelections.includes(opt)}
                                onClick={() => handleMultiToggle(opt)}
                                delay={i * 50}
                              />
                            ) : (
                              <ChoiceChip
                                key={opt}
                                label={opt}
                                selected={false}
                                onClick={() => handleChoiceClick(opt)}
                                delay={i * 50}
                              />
                            )
                          )}
                        </div>
                        {msg.choices.multiSelect &&
                          multiSelections.length > 0 && (
                            <button
                              onClick={handleMultiConfirm}
                              className="flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-full bg-cyan-500 text-white hover:bg-cyan-400 transition-colors cursor-pointer animate-fade-in"
                            >
                              Continue
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                      </div>
                    )}
                </div>
              ) : (
                <div className="max-w-[75%] bg-cyan-500/10 border border-cyan-500/20 rounded-2xl px-5 py-3">
                  <p className="text-sm text-cyan-800 dark:text-cyan-100">
                    {msg.content}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isStreaming && (
            <div className="flex justify-start animate-slide-up">
              <div className="bg-slate-50 dark:bg-foreground/[0.03] border border-slate-200 dark:border-foreground/[0.06] rounded-2xl px-5 py-3">
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="flex justify-center py-4 animate-slide-up">
              <div className="flex items-center gap-2 text-[12px] text-cyan-500 tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Redirecting to your dashboard...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area — Claude-style centered input */}
      {!isComplete && (
        <div className="border-t border-slate-200 dark:border-foreground/[0.06] px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-2 bg-slate-50 dark:bg-foreground/[0.03] border border-slate-200 dark:border-foreground/[0.08] rounded-2xl px-4 py-2.5 focus-within:border-cyan-500/30 transition-colors">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  handleTextareaInput();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Tell me about your business..."
                disabled={isStreaming}
                rows={1}
                className="flex-1 resize-none bg-transparent text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none disabled:opacity-40 py-1"
                style={{ fontFamily: "inherit", maxHeight: "120px" }}
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isStreaming}
                className="shrink-0 w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-700 text-center mt-2 tracking-wide">
              Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
