"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  History,
  Eye,
  Columns3,
  Upload,
  Key,
  CreditCard,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { href: "/score",      label: "Score Explorer",  icon: Target },
  { href: "/history",    label: "Score History",   icon: History },
  { href: "/watchlist",  label: "Watchlist",       icon: Eye },
  { href: "/pipeline",   label: "Pipeline Board",  icon: Columns3 },
  { href: "/bulk",       label: "Bulk Scorer",     icon: Upload },
  { href: "/api-keys",   label: "API Keys",        icon: Key },
  { href: "/billing",    label: "Billing",         icon: CreditCard },
];

export default function DashboardNav({ creditsRemaining = 0 }: { creditsRemaining?: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-white/[0.06] bg-black/80 p-4 space-y-1 sticky top-0 h-screen">
      <div className="mb-6 px-3 pt-2">
        <span className="text-cyan-400 text-xs tracking-[0.2em] font-bold">[ INTENT IQ ]</span>
        <p className="text-slate-600 text-[10px] tracking-[0.15em] mt-1">v1.0</p>
      </div>

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-xs tracking-[0.05em] transition-all duration-200 cursor-pointer border",
              active
                ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.03] border-transparent"
            )}
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", active ? "text-cyan-400" : "text-slate-600")}
            />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-white/[0.07] space-y-2">
        {/* Credits indicator */}
        <div className={`px-3 py-2.5 border ${creditsRemaining < 5 ? "border-amber-500/30 bg-amber-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-0.5">Credits</p>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${creditsRemaining < 5 ? "text-amber-400" : "text-slate-200"}`}>
              {creditsRemaining}
              {creditsRemaining < 5 && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5">Low</span>}
            </span>
            <Link href="/billing" className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors tracking-[0.1em]">
              Top up →
            </Link>
          </div>
        </div>

        <SignOutButton redirectUrl="/">
          <button className="flex w-full items-center gap-3 px-3 py-2.5 text-xs tracking-[0.05em] text-slate-500 transition-all duration-200 hover:text-red-400 hover:bg-red-500/10 border border-transparent cursor-pointer">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
