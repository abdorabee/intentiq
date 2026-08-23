export default function SettingsLoading() {
  return (
    <div role="status" aria-label="Loading settings" className="animate-pulse space-y-6">
      <div className="space-y-3"><div className="h-4 w-28 bg-slate-200 dark:bg-white/10" /><div className="h-8 w-56 bg-slate-200 dark:bg-white/10" /><div className="h-4 max-w-xl bg-slate-200 dark:bg-white/10" /></div>
      <div className="h-48 border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5" />
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
