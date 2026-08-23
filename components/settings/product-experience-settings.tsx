"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

import type { TourStatus } from "@/lib/user-preferences";

type TourState = { tour_version: number; tour_status: TourStatus; tour_step: number };

export function ProductExperienceSettings({
  initial,
  fetcher = fetch,
}: {
  initial: TourState;
  fetcher?: typeof fetch;
}) {
  const [state, setState] = useState(initial);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function restart() {
    if (saveState === "saving") return;
    const previous = state;
    const next: TourState = { ...state, tour_status: "not_started", tour_step: 0 };
    setState(next);
    setSaveState("saving");
    try {
      const response = await fetcher("/api/user/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("restart failed");
      setSaveState("saved");
    } catch {
      setState(previous);
      setSaveState("error");
    }
  }

  return (
    <section className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
      <h2 className="text-sm font-semibold">Guided product tour</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-slate-500">Version</dt><dd>{state.tour_version}</dd></div>
        <div><dt className="text-xs text-slate-500">Status</dt><dd className="capitalize">{state.tour_status.replaceAll("_", " ")}</dd></div>
        <div><dt className="text-xs text-slate-500">Step</dt><dd>{state.tour_step}</dd></div>
      </dl>
      <button type="button" disabled={saveState === "saving"} onClick={() => void restart()} className="mt-5 inline-flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm dark:border-white/15">
        <RotateCcw className={`h-4 w-4 ${saveState === "saving" ? "animate-spin" : ""}`} aria-hidden />
        {saveState === "saving" ? "Restarting…" : "Restart guided tour"}
      </button>
      {saveState === "saved" && <p role="status" className="mt-3 text-xs text-emerald-600">The guided tour is ready to restart.</p>}
      {saveState === "error" && <p role="alert" className="mt-3 text-xs text-red-600">The guided tour could not be restarted. Try again.</p>}
    </section>
  );
}
