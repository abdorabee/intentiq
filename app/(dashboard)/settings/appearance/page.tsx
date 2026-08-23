import { Palette } from "lucide-react";

import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";

export default function AppearancePage() {
  return <div className="space-y-7"><SettingsPageHeader icon={Palette} eyebrow="Settings" title="Appearance" description="Set the visual theme and desktop navigation preference for your account." /><AppearanceSettings /></div>;
}
