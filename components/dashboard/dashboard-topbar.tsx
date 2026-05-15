"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search, Filter, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const CRUMB: Record<string, { parent: string; current: string }> = {
  "/dashboard": { parent: "Workspace", current: "Dashboard" },
  "/analyze": { parent: "Workspace", current: "Analyze" },
  "/memory": { parent: "Workspace", current: "Memory" },
  "/pipeline": { parent: "Workspace", current: "Intent Hub" },
  "/people": { parent: "Workspace", current: "People" },
  "/history": { parent: "Workspace", current: "Pipeline" },
  "/watchlist": { parent: "Workspace", current: "Watchlist" },
  "/autopilot": { parent: "Workspace", current: "Autopilot" },
  "/bulk": { parent: "Workspace", current: "Bulk" },
  "/billing": { parent: "Workspace", current: "Billing" },
  "/api-keys": { parent: "Workspace", current: "API Keys" },
  "/score": { parent: "Workspace", current: "Score" },
  "/settings": { parent: "Workspace", current: "Settings" },
};

export default function DashboardTopbar() {
  const pathname = usePathname();
  const crumb = CRUMB[pathname] ?? { parent: "Workspace", current: "IntentIQ" };

  return (
    <header
      className={cn(
        "hidden shrink-0 border-b border-white/[0.08] bg-[#08090a] lg:flex h-11 items-center gap-2.5 px-5"
      )}
    >
      <div className="inline-flex items-center gap-1.5 text-[13px] text-[#b4bbc8] tracking-[-0.011em]">
        <LayoutGrid className="h-3.5 w-3.5 text-[#8a8f98]" aria-hidden />
        <span>{crumb.parent}</span>
        <span className="text-[#62666d]">/</span>
        <span className="font-medium text-[#f7f8f8]">{crumb.current}</span>
      </div>

      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.1)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4ade80] font-mono">
        <span className="h-1 w-1 rounded-full bg-[#4ade80] shadow-[0_0_4px_#4ade80]" />
        HOT 12
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(245,181,68,0.25)] bg-[rgba(245,181,68,0.1)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f5b544] font-mono">
        <span className="h-1 w-1 rounded-full bg-[#f5b544]" />
        WARM 38
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(138,143,152,0.22)] bg-[rgba(138,143,152,0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a8f98] font-mono">
        <span className="h-1 w-1 rounded-full bg-[#8a8f98]" />
        COLD 197
      </span>

      <div className="flex-1" />

      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] text-[#b4bbc8] transition-colors hover:bg-white/[0.04] hover:text-[#f7f8f8]"
      >
        <Search className="h-3 w-3 opacity-85" />
        Search
        <kbd className="ml-1 rounded border border-white/[0.06] bg-white/[0.06] px-1.5 py-px font-mono text-[11px] text-[#8a8f98]">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1 text-[13px] text-[#b4bbc8] transition-colors hover:border-white/[0.13] hover:bg-white/[0.04] hover:text-[#f7f8f8]"
      >
        <Filter className="h-3 w-3 opacity-85" />
        Filter
      </button>
      <button
        type="button"
        className="relative grid h-7 w-7 place-items-center rounded text-[#8a8f98] hover:bg-white/[0.06] hover:text-[#f7f8f8]"
        aria-label="Notifications"
      >
        <Bell className="h-3.5 w-3.5" />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80,0_0_0_2px_#0e1011]" />
      </button>
      <Link
        href="/score"
        className="inline-flex items-center gap-1.5 rounded-md bg-[#5e6ad2] px-3 py-1 text-[13px] font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.3)] transition-colors hover:bg-[#7170ff]"
      >
        <Plus className="h-3 w-3" strokeWidth={2.2} />
        Score account
      </Link>
    </header>
  );
}
