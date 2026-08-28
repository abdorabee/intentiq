"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  isSettingsNavActive,
  SETTINGS_NAV_ITEMS,
  settingsNavValue,
} from "@/lib/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="settings-page">
      <nav className="settings-nav" aria-label="Settings">
        {SETTINGS_NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`settings-nav-item${isSettingsNavActive(pathname, item.href) ? " active" : ""}`}
            aria-current={isSettingsNavActive(pathname, item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <label className="settings-nav-select-wrap">
        <span className="sr-only">Settings section</span>
        <select
          className="settings-nav-select"
          value={settingsNavValue(pathname)}
          onChange={(event) => router.push(event.target.value)}
          aria-label="Settings section"
        >
          {SETTINGS_NAV_ITEMS.map((item) => (
            <option key={item.id} value={item.href}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <div className="settings-content">{children}</div>
    </div>
  );
}
