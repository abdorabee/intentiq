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
          className="group fixed bottom-6 right-6 z-30 flex cursor-pointer items-center gap-2 border border-[#5e6ad2]/30 bg-[#5e6ad2]/12 px-4 py-2.5 text-[#c9c4ff] shadow-sm transition-all duration-200 hover:border-[#7170ff]/45 hover:bg-[#5e6ad2]/22 dark:shadow-none"
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
