"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { tourProgressSchema } from "@/lib/product-tour";
import { publishAuthoritativeTourProgress } from "@/lib/product-tour-events";
import type { TourStatus } from "@/lib/user-preferences";

type TourState = { tour_version: number; tour_status: TourStatus; tour_step: number };

export function ProductExperienceSettings({
  initial,
  fetcher = fetch,
}: {
  initial: TourState;
  fetcher?: typeof fetch;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "conflict" | "error">("idle");

  async function restart() {
    if (saveState === "saving") return;
    const previous = state;
    setSaveState("saving");
    try {
      const response = await fetcher("/api/user/tour", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "restart",
          expected: {
            version: previous.tour_version,
            status: previous.tour_status,
            step: previous.tour_step,
          },
        }),
      });
      const payload = await response.json() as { tour?: unknown };
      if (response.status === 409) {
        const conflict = tourProgressSchema.safeParse(payload.tour);
        if (!conflict.success) throw new Error("restart conflict could not be reconciled");
        setState({
          tour_version: conflict.data.tour_version,
          tour_status: conflict.data.tour_status,
          tour_step: conflict.data.tour_step,
        });
        publishAuthoritativeTourProgress(conflict.data);
        setSaveState("conflict");
        return;
      }
      if (!response.ok) throw new Error("restart failed");
      const authoritative = tourProgressSchema.parse(payload.tour);
      setState({
        tour_version: authoritative.tour_version,
        tour_status: authoritative.tour_status,
        tour_step: authoritative.tour_step,
      });
      setSaveState("saved");
      publishAuthoritativeTourProgress(authoritative);
      router.push("/dashboard");
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
      {state.tour_version > 0 && (
        <button type="button" disabled={saveState === "saving"} onClick={() => void restart()} className="mt-5 inline-flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm dark:border-white/15">
          <RotateCcw className={`h-4 w-4 ${saveState === "saving" ? "animate-spin" : ""}`} aria-hidden />
          {saveState === "saving" ? "Restarting…" : "Restart guided tour"}
        </button>
      )}
      {saveState === "saved" && <p role="status" className="mt-3 text-xs text-emerald-600">The guided tour is restarting on Dashboard.</p>}
      {saveState === "conflict" && <p role="alert" className="mt-3 text-xs text-amber-700 dark:text-amber-300">Tour progress changed on another device. Review the current state and try again.</p>}
      {saveState === "error" && <p role="alert" className="mt-3 text-xs text-red-600">The guided tour could not be restarted. Try again.</p>}
    </section>
  );
}
