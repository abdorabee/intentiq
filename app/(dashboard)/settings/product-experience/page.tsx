import { auth } from "@clerk/nextjs/server";
import { Sparkles } from "lucide-react";

import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { ProductExperienceSettings } from "@/components/settings/product-experience-settings";
import { getOrCreateUserPreferences } from "@/lib/user-preferences-server";
import { ACTIVE_PRODUCT_TOUR_VERSION, isProductTourVersionActive } from "@/lib/product-tour";

export default async function ProductExperiencePage() {
  const { userId } = await auth();
  if (!userId) return null;
  const preferences = await getOrCreateUserPreferences(userId);
  if (!preferences) throw new Error("User preferences are unavailable");

  const active = isProductTourVersionActive(preferences.tour_version, ACTIVE_PRODUCT_TOUR_VERSION);
  return (
    <div className="space-y-7">
      <SettingsPageHeader icon={Sparkles} eyebrow="Settings" title="Product experience" description="Review contextual guidance state for this account." />
      {active ? (
        <ProductExperienceSettings initial={{ tour_version: preferences.tour_version, tour_status: preferences.tour_status, tour_step: preferences.tour_step }} />
      ) : (
        <section className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
          <h2 className="text-sm font-semibold">Guided product tour</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">The contextual tour is not active yet. Restart controls will appear only after the real tour engine and targets are available.</p>
        </section>
      )}
    </div>
  );
}
