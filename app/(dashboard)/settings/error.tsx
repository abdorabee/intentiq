"use client";

import { RotateCcw } from "lucide-react";

export default function SettingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="border border-red-500/30 bg-red-500/5 p-6">
      <h1 className="text-lg font-semibold text-slate-950 dark:text-white">Settings could not load</h1>
      <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">The latest account settings are temporarily unavailable.</p>
      <button type="button" onClick={reset} className="mt-4 inline-flex items-center gap-2 border border-red-500/30 px-3 py-2 text-sm"><RotateCcw className="h-4 w-4" aria-hidden />Try again</button>
    </div>
  );
}
