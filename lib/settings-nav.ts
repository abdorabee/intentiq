export interface SettingsNavItem {
  href: string;
  id: "account" | "selling" | "appearance" | "experience" | "billing";
  label: string;
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { href: "/settings", id: "account", label: "Account" },
  { href: "/settings/selling", id: "selling", label: "Selling profile" },
  { href: "/settings/appearance", id: "appearance", label: "Appearance" },
  { href: "/settings/experience", id: "experience", label: "Experience" },
  { href: "/settings/billing", id: "billing", label: "Billing" },
];

export function settingsNavValue(pathname: string): string {
  if (pathname === "/settings" || pathname === "/settings/account") {
    return "/settings";
  }
  const match = SETTINGS_NAV_ITEMS.find(
    (item) => item.href !== "/settings" && pathname.startsWith(item.href)
  );
  return match?.href ?? "/settings";
}

export function isSettingsNavActive(pathname: string, href: string): boolean {
  return settingsNavValue(pathname) === href;
}
