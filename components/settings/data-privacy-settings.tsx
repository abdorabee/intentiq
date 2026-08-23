"use client";

import Link from "next/link";
import { useState } from "react";

import { ANALYTICS_CONSENT_EVENT } from "@/components/google-analytics";
import { patchUserPreferences } from "@/lib/user-preferences";

export function DataPrivacySettings({ initialAnalyticsEnabled }: { initialAnalyticsEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialAnalyticsEnabled);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function persistAnalytics(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    setStatus("saving");
    try {
      await patchUserPreferences({ analytics_enabled: next });
      setStatus("saved");
      window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: next }));
    } catch {
      setEnabled(previous);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <section className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Product analytics</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              Allow Google Analytics to measure signed-in page usage. The script is not loaded when this persisted preference is off.
            </p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <span className="sr-only">Product analytics</span>
            <input
              type="checkbox"
              aria-label="Product analytics"
              checked={enabled}
              disabled={status === "saving"}
              onChange={(event) => void persistAnalytics(event.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-11 border border-slate-300 bg-slate-200 transition-colors peer-checked:border-cyan-500 peer-checked:bg-cyan-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-500 dark:border-white/20 dark:bg-white/10" />
            <span className="pointer-events-none absolute left-1 h-4 w-4 bg-white transition-transform peer-checked:translate-x-5" />
          </label>
        </div>
        <p
          role={status === "error" ? "alert" : "status"}
          className={`mt-3 text-xs ${status === "error" ? "text-red-600 dark:text-red-400" : "text-slate-500"}`}
        >
          {status === "saving" && "Saving analytics preference…"}
          {status === "saved" && "Analytics preference saved."}
          {status === "error" && "Your analytics preference could not be saved. The last saved value was restored."}
        </p>
      </section>

      <section className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">How data is handled</h2>
        <div className="mt-3 grid gap-3 text-xs leading-5 text-slate-600 sm:grid-cols-2 dark:text-slate-400">
          <p>Clerk manages identity and security. Supabase stores product data and account preferences. Polar manages payment details.</p>
          <p>Company and signal context may be sent through OpenRouter for AI-generated summaries and Assistant responses.</p>
        </div>
      </section>

      <section aria-labelledby="legal-heading" className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <h2 id="legal-heading" className="text-sm font-semibold text-slate-950 dark:text-white">Policies and security</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ["Privacy policy", "/privacy"],
            ["Terms of service", "/terms"],
            ["Security overview", "/legal/security"],
            ["Data processing agreement", "/legal/dpa"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-cyan-500/50 hover:text-cyan-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-cyan-300">
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
