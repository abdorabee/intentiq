"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { CHAT_CREDIT_COST } from "@/lib/types";

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  creditsRemaining: number;
}

export default function ChatInput({ onSend, isStreaming, creditsRemaining }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !isStreaming && creditsRemaining >= CHAT_CREDIT_COST;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-white/[0.06] p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); handleInput(); }}
            onKeyDown={handleKeyDown}
            placeholder={creditsRemaining < CHAT_CREDIT_COST ? "Insufficient credits..." : "Ask about your pipeline..."}
            disabled={creditsRemaining < CHAT_CREDIT_COST}
            rows={1}
            className="w-full resize-none bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] px-3 py-2.5 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/30 transition-colors disabled:opacity-40"
            style={{ fontFamily: "inherit" }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[10px] text-slate-600 tracking-[0.1em]">
          {CHAT_CREDIT_COST} cr / message
        </span>
        <span className="text-[10px] text-slate-600 tracking-[0.1em]">
          Shift+Enter for new line
        </span>
      </div>
    </div>
  );
}
