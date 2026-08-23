import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <SettingsNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
