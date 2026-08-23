import { UserProfile } from "@clerk/nextjs";
import { UserCog } from "lucide-react";

import { SettingsPageHeader } from "@/components/settings/settings-page-header";

export default function AccountSettingsPage() {
  return (
    <div className="space-y-7">
      <SettingsPageHeader icon={UserCog} eyebrow="Settings" title="Account & security" description="Clerk is the identity authority for your profile, email addresses, avatar, password, MFA, and active sessions." />
      <p className="border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-5 text-amber-800 dark:text-amber-300">Account deletion is not available yet while the verified product-data deletion cascade is being completed.</p>
      <div className="min-w-0 overflow-x-auto">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: { width: "100%" },
              cardBox: { width: "100%", maxWidth: "none", boxShadow: "none" },
              dangerSection: { display: "none" },
            },
          }}
        />
      </div>
    </div>
  );
}
