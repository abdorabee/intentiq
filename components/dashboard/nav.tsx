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
    <aside className="hidden lg:flex w-60 flex-col glass-nav p-4 space-y-1 sticky top-0 h-screen">
      <div className="mb-6 px-3 pt-2">
        <span className="text-xl font-black text-gradient">IntentIQ</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
              active
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 glow-cyan"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent"
            )}
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", active ? "text-cyan-400" : "text-slate-500")}
            />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-white/[0.07] space-y-2">
        {/* Credits indicator */}
        <div className={`px-3 py-2.5 rounded-xl glass border ${creditsRemaining < 5 ? "border-amber-500/30 bg-amber-500/5" : "border-white/[0.06]"}`}>
          <p className="text-[10px] uppercase tracking-wide text-slate-600 mb-0.5">Credits</p>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${creditsRemaining < 5 ? "text-amber-400" : "text-slate-200"}`}>
              {creditsRemaining}
              {creditsRemaining < 5 && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-full">Low</span>}
            </span>
            <Link href="/billing" className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
              Top up →
            </Link>
          </div>
        </div>

        <SignOutButton redirectUrl="/">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all duration-200 hover:text-red-400 hover:bg-red-500/10 border border-transparent cursor-pointer">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
