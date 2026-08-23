"use client";

import { Monitor, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";

import { useDashboardShell } from "@/components/dashboard/dashboard-shell";
import { useTheme } from "@/components/theme-provider";
import type { ThemePreference } from "@/lib/user-preferences";

const THEMES: Array<{ value: ThemePreference; label: string; description: string; icon: typeof Sun }> = [
  { value: "system", label: "System", description: "Follow this device", icon: Monitor },
  { value: "light", label: "Light", description: "Light workspace", icon: Sun },
  { value: "dark", label: "Dark", description: "Dark workspace", icon: Moon },
];

export function AppearanceSettings() {
  const { theme, setTheme, preferenceStatus: themeStatus } = useTheme();
  const { collapsed, setSidebarCollapsed, preferenceStatus: sidebarStatus } = useDashboardShell();
  const failed = themeStatus === "error" || sidebarStatus === "error";
  const saving = themeStatus === "saving" || sidebarStatus === "saving";

  return (
    <div className="space-y-6">
      <section aria-labelledby="theme-heading" className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <h2 id="theme-heading" className="text-sm font-semibold text-slate-950 dark:text-white">Theme</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Saved to your account and applied on every signed-in device.</p>
        <div role="radiogroup" aria-label="Theme" className="mt-4 grid gap-3 sm:grid-cols-3">
          {THEMES.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-label={option.label}
                aria-checked={theme === option.value}
                onClick={() => setTheme(option.value)}
                className={`flex items-start gap-3 border p-4 text-left transition-colors ${theme === option.value ? "border-cyan-500 bg-cyan-500/10" : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"}`}
              >
                <Icon className="mt-0.5 h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden />
                <span><span className="block text-sm font-medium">{option.label}</span><span className="mt-1 block text-xs text-slate-500">{option.description}</span></span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="sidebar-heading" className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <h2 id="sidebar-heading" className="text-sm font-semibold text-slate-950 dark:text-white">Sidebar</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose the default desktop navigation width. Mobile always uses the full drawer.</p>
        <div role="radiogroup" aria-label="Sidebar" className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { value: false, label: "Expanded", icon: PanelLeftOpen },
            { value: true, label: "Collapsed", icon: PanelLeftClose },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-label={option.label}
                aria-checked={collapsed === option.value}
                onClick={() => setSidebarCollapsed(option.value)}
                className={`flex items-center gap-3 border p-4 text-left transition-colors ${collapsed === option.value ? "border-cyan-500 bg-cyan-500/10" : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"}`}
              >
                <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      <p role={failed ? "alert" : "status"} className={`text-xs ${failed ? "text-red-600 dark:text-red-400" : "text-slate-500"}`}>
        {failed
          ? "Your appearance preference could not be saved. The last saved value was restored."
          : saving
            ? "Saving appearance preference…"
            : "Changes save automatically. If a save fails, the last saved preference is restored."}
      </p>
    </div>
  );
}
