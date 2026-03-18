"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import ChatPanel from "./chat-panel";

interface ChatTriggerProps {
  creditsRemaining: number;
}

export default function ChatTrigger({ creditsRemaining }: ChatTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/25 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200 cursor-pointer group shadow-sm dark:shadow-none"
          aria-label="Open Intent Copilot"
        >
          <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
          <span className="text-xs tracking-[0.1em] font-bold">COPILOT</span>
        </button>
      )}

      {/* Chat panel */}
      <ChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        creditsRemaining={creditsRemaining}
      />
    </>
  );
}
