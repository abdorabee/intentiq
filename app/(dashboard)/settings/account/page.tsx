import { UserProfile } from "@clerk/nextjs";
import { UserCog } from "lucide-react";

import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { hasClerkLifecycleCapability } from "@/lib/clerk-account-capability";

export default function AccountSettingsPage() {
  const accountManagementEnabled = hasClerkLifecycleCapability();
  return (
    <div className="space-y-7">
      <SettingsPageHeader icon={UserCog} eyebrow="Settings" title="Account & security" description="Clerk is the identity authority for your profile, email addresses, avatar, password, MFA, and active sessions." />
      {accountManagementEnabled ? (
        <div className="min-w-0 overflow-x-auto">
          <UserProfile routing="hash" appearance={{ elements: { rootBox: { width: "100%" }, cardBox: { width: "100%", maxWidth: "none", boxShadow: "none" } } }} />
        </div>
      ) : (
        <section className="border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6 text-amber-800 dark:text-amber-300">
          Account and security management is temporarily unavailable while the signed identity lifecycle integration is not enabled for this environment.
        </section>
      )}
    </div>
  );
}
