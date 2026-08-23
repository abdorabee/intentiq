import { auth } from "@clerk/nextjs/server";
import { ShieldCheck } from "lucide-react";

import { DataPrivacySettings } from "@/components/settings/data-privacy-settings";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { getOrCreateUserPreferences } from "@/lib/user-preferences-server";

export default async function DataPrivacyPage() {
  const { userId } = await auth();
  if (!userId) return null;
  const preferences = await getOrCreateUserPreferences(userId);
  if (!preferences) throw new Error("User preferences are unavailable");

  return <div className="space-y-7"><SettingsPageHeader icon={ShieldCheck} eyebrow="Settings" title="Data & privacy" description="Control optional product analytics and review how VesperWise handles account and product data." /><DataPrivacySettings initialAnalyticsEnabled={preferences.analytics_enabled} /></div>;
}
