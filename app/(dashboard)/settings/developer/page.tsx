import Link from "next/link";
import { Code2 } from "lucide-react";

import { ApiKeysManager } from "@/components/settings/api-keys-manager";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";

export default function DeveloperSettingsPage() {
  return (
    <div className="space-y-7">
      <SettingsPageHeader icon={Code2} eyebrow="Settings" title="Developer" description="Create credentials for VesperWise REST endpoints. Secrets are displayed only once and stored as SHA-256 hashes." />
      <div className="flex flex-wrap gap-2 text-xs"><Link href="/docs" className="border border-slate-300 px-3 py-2 dark:border-white/20">API reference</Link><Link href="/billing" className="border border-slate-300 px-3 py-2 dark:border-white/20">Plans & billing</Link></div>
      <ApiKeysManager />
    </div>
  );
}
