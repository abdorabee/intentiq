import Link from "next/link";

import { getVisibleSettingsDestinations } from "../../../lib/dashboard-search";

export default function SettingsPage() {
  const destinations = getVisibleSettingsDestinations();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">
          Manage the working preferences and account services available to this workspace.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {destinations.map((destination) => {
          const Icon = destination.icon;
          return (
            <Link
              key={destination.id}
              href={destination.href}
              className="group border border-slate-200 bg-white p-5 transition-colors hover:border-cyan-500/40 dark:border-foreground/[0.08] dark:bg-foreground/[0.02]"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center border border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {destination.label}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {destination.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
