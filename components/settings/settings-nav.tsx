"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getVisibleSettingsDestinations,
  isNavigationItemActive,
} from "@/lib/dashboard-search";

export function SettingsNav() {
  const pathname = usePathname();
  const destinations = getVisibleSettingsDestinations();

  return (
    <nav aria-label="Settings" className="min-w-0 lg:w-56 lg:shrink-0">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-2 lg:sticky lg:top-20 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:pr-5 lg:pb-0 dark:border-white/10">
        {destinations.map((destination) => {
          const Icon = destination.icon;
          const active = isNavigationItemActive(destination, pathname);
          return (
            <Link
              key={destination.id}
              href={destination.href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 ${
                active
                  ? "bg-cyan-500/10 font-medium text-cyan-700 dark:text-cyan-300"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {destination.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
