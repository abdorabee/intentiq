"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "@/components/settings/profile-tab";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";
import { NotificationsTab } from "@/components/settings/notifications-tab";
import { BillingTab } from "@/components/settings/billing-tab";
import type { DbUser } from "@/lib/types";

type SettingsTab = "profile" | "api-keys" | "notifications" | "billing";

interface SettingsViewProps {
  defaultTab: SettingsTab;
  identity: {
    name: string;
    email: string;
    plan: DbUser["plan"];
    memberSince: string | null;
  };
  billing: {
    plan: DbUser["plan"];
    creditsRemaining: number;
    renewsAt: string | null;
    cancelAtPeriodEnd: boolean;
    hasPolarSubscription: boolean;
  };
}

export function SettingsView({ defaultTab, identity, billing }: SettingsViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>(defaultTab);

  function handleTabChange(next: string) {
    setTab(next as SettingsTab);
    router.replace(`/settings?tab=${next}`, { scroll: false });
  }

  return (
    <DashboardPageShell
      eyebrow="[SETTINGS]"
      title="Settings"
      description="Manage your account, ICP memory, API keys, notifications, and plan."
    >
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="profile">Profile & Account</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab identity={identity} />
        </TabsContent>
        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysPanel />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <BillingTab {...billing} />
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  );
}
