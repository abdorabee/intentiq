import type { LucideIcon } from "lucide-react";

export function SettingsPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
        <Icon className="h-4 w-4" aria-hidden />
        {eyebrow}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>
      <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
    </header>
  );
}
