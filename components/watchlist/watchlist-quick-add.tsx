"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface WatchlistQuickAddHandle {
  focus: () => void;
}

interface WatchlistQuickAddProps {
  onAdd: (domain: string) => Promise<void>;
  adding: boolean;
  error: string | null;
}

export const WatchlistQuickAdd = forwardRef<WatchlistQuickAddHandle, WatchlistQuickAddProps>(
  function WatchlistQuickAdd({ onAdd, adding, error }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    async function handleSubmit() {
      const domain = inputRef.current?.value.trim();
      if (!domain || adding) return;
      await onAdd(domain);
      if (inputRef.current) inputRef.current.value = "";
    }

    return (
      <div>
        <div className="quick-add">
          <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            width="14"
            height="14"
            style={{ color: "var(--text-tertiary)" }}
            aria-hidden
          >
            <path d="M7 2v10M2 7h10" />
          </svg>
          <input
            ref={inputRef}
            className="quick-add-input"
            placeholder="Add by domain — e.g. snowflake.com, openai.com"
            disabled={adding}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />
          <span className="hint">
            Press <span className="kbd">↵</span> to add
          </span>
        </div>
        {error && (
          <p style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</p>
        )}
      </div>
    );
  },
);
