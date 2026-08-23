import { auth } from "@clerk/nextjs/server";
import { Sparkles } from "lucide-react";

import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { getOrCreateUserPreferences } from "@/lib/user-preferences-server";

export default async function ProductExperiencePage() {
  const { userId } = await auth();
  if (!userId) return null;
  const preferences = await getOrCreateUserPreferences(userId);
  if (!preferences) throw new Error("User preferences are unavailable");

  const active = preferences.tour_version > 0;
  return (
    <div className="space-y-7">
      <SettingsPageHeader icon={Sparkles} eyebrow="Settings" title="Product experience" description="Review contextual guidance state for this account." />
      <section className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <h2 className="text-sm font-semibold">Guided product tour</h2>
        {active ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-xs text-slate-500">Version</dt><dd>{preferences.tour_version}</dd></div><div><dt className="text-xs text-slate-500">Status</dt><dd className="capitalize">{preferences.tour_status.replaceAll("_", " ")}</dd></div><div><dt className="text-xs text-slate-500">Step</dt><dd>{preferences.tour_step}</dd></div></dl>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">The contextual tour is not active yet. Restart controls will appear only after the real tour engine and targets are available.</p>
        )}
      </section>
    </div>
  );
}
