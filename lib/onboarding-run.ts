"use client";

import { useCallback, useRef, useState } from "react";

import type { IntentScore } from "@/lib/types";

export type ScoringRunStatus = "queued" | "scoring" | "done" | "error";

export interface ScoringRunEntry {
  domain: string;
  status: ScoringRunStatus;
  result?: IntentScore;
  error?: string;
}

async function requestScore(domain: string): Promise<IntentScore> {
  const response = await fetch("/api/v1/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });
  const payload = (await response.json()) as IntentScore & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Scoring failed");
  return payload;
}

/**
 * Client-simulated "live" scoring run: sequential real calls to the existing
 * synchronous /api/v1/score endpoint, one per seed domain, with per-domain
 * status the UI can render incrementally. There is no streaming backend —
 * this hook is the entire mechanism behind screen 4's progress UI.
 */
export function useScoringRun() {
  const [entries, setEntries] = useState<ScoringRunEntry[]>([]);
  const [running, setRunning] = useState(false);
  const runIdRef = useRef(0);

  const start = useCallback(async (domains: string[]) => {
    const runId = ++runIdRef.current;
    const unique = Array.from(new Set(domains.map((domain) => domain.toLowerCase())));
    setEntries(unique.map((domain) => ({ domain, status: "queued" as const })));
    setRunning(true);

    for (const domain of unique) {
      if (runIdRef.current !== runId) return; // superseded by a newer run

      setEntries((prev) =>
        prev.map((entry) => (entry.domain === domain ? { ...entry, status: "scoring" } : entry))
      );

      try {
        const result = await requestScore(domain);
        if (runIdRef.current !== runId) return;
        setEntries((prev) =>
          prev.map((entry) => (entry.domain === domain ? { ...entry, status: "done", result } : entry))
        );
      } catch (error) {
        if (runIdRef.current !== runId) return;
        setEntries((prev) =>
          prev.map((entry) =>
            entry.domain === domain
              ? { ...entry, status: "error", error: error instanceof Error ? error.message : "Scoring failed" }
              : entry
          )
        );
      }
    }

    if (runIdRef.current === runId) setRunning(false);
  }, []);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    setEntries([]);
    setRunning(false);
  }, []);

  return { entries, running, start, reset };
}
