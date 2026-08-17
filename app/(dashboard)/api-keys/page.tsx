import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";

export default function ApiKeysPage() {
  return (
    <DashboardPageShell
      eyebrow="[DEVELOPERS]"
      title="API Keys"
      description="Keys for programmatic access to scoring, bulk, and watchlist endpoints."
    >
      <ApiKeysPanel />
    </DashboardPageShell>
  );
}
