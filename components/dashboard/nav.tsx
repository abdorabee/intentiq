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
  Upload,
  Key,
  CreditCard,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { href: "/score",      label: "Score Explorer",  icon: Target },
  { href: "/history",    label: "Score History",   icon: History },
  { href: "/watchlist",  label: "Watchlist",       icon: Eye },
  { href: "/bulk",       label: "Bulk Scorer",     icon: Upload },
  { href: "/api-keys",   label: "API Keys",        icon: Key },
  { href: "/billing",    label: "Billing",         icon: CreditCard },
];

export default function DashboardNav() {
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
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 glow-indigo"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent"
            )}
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", active ? "text-indigo-400" : "text-slate-500")}
            />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-white/[0.07]">
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
