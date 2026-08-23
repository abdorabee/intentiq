import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Building2,
  CreditCard,
  Eye,
  Flame,
  Gauge,
  History,
  Inbox,
  Key,
  LayoutGrid,
  ListChecks,
  Settings,
  Upload,
  UserSearch,
  Zap,
} from "lucide-react";

export type SearchResultKind = "page" | "company" | "person" | "watchlist" | "list" | "action";
export type NavigationAvailability = "available" | "later";
export type NavigationCount = "inbox" | "watchlist" | "pipelineHot";

export interface SearchNavItem {
  id: string;
  kind: "page";
  label: string;
  href: string;
  keywords: string;
  icon: LucideIcon;
}

export interface DashboardNavigationItem extends SearchNavItem {
  availability: NavigationAvailability;
  activePaths?: readonly string[];
  badge?: "Beta";
  count?: NavigationCount;
  hotCount?: boolean;
}

export interface DashboardNavigationGroup {
  id: "workspace" | "research" | "automation" | "utilities";
  label: "Workspace" | "Research" | "Automation" | "Utilities";
  items: readonly DashboardNavigationItem[];
}

export interface SettingsDestination extends SearchNavItem {
  availability: NavigationAvailability;
  description: string;
}

export interface SearchResultItem {
  id: string;
  kind: SearchResultKind;
  label: string;
  sublabel?: string;
  href: string;
  meta?: string;
  band?: "HOT" | "WARM" | "COLD" | null;
}

export const NAVIGATION_GROUPS: readonly DashboardNavigationGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "dashboard", kind: "page", label: "Dashboard", href: "/dashboard", keywords: "home overview", icon: LayoutGrid, availability: "available" },
      { id: "pipeline", kind: "page", label: "Intent Hub", href: "/pipeline", keywords: "pipeline intent hub deals", icon: Flame, availability: "available", count: "pipelineHot", hotCount: true },
      { id: "score", kind: "page", label: "Score", href: "/score", keywords: "score company domain lookup", icon: Gauge, availability: "available" },
      { id: "assistant", kind: "page", label: "Assistant", href: "/assistant", keywords: "assistant copilot ai", icon: Bot, availability: "later" },
    ],
  },
  {
    id: "research",
    label: "Research",
    items: [
      { id: "people", kind: "page", label: "People", href: "/people", keywords: "people contacts person scoring", icon: UserSearch, availability: "available", badge: "Beta" },
      { id: "watchlist", kind: "page", label: "Watchlist", href: "/watchlist", keywords: "watchlist monitor accounts", icon: Eye, availability: "available", count: "watchlist" },
      { id: "lists", kind: "page", label: "Lists", href: "/lists", keywords: "lists segments accounts", icon: ListChecks, availability: "available" },
      { id: "history", kind: "page", label: "History", href: "/history", keywords: "history runs past scores", icon: History, availability: "available" },
    ],
  },
  {
    id: "automation",
    label: "Automation",
    items: [
      { id: "bulk", kind: "page", label: "Bulk Score", href: "/bulk", keywords: "bulk csv upload score companies", icon: Upload, availability: "available" },
      { id: "autopilot", kind: "page", label: "Autopilot", href: "/autopilot", keywords: "autopilot workflows automation", icon: Zap, availability: "later" },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    items: [
      { id: "inbox", kind: "page", label: "Inbox", href: "/inbox", keywords: "inbox notifications messages alerts", icon: Inbox, availability: "available", count: "inbox" },
      { id: "settings", kind: "page", label: "Settings", href: "/settings", keywords: "settings business profile billing credits plan invoice api keys developer token", icon: Settings, availability: "available", activePaths: ["/settings", "/billing", "/api-keys"] },
    ],
  },
];

export const SETTINGS_DESTINATIONS: readonly SettingsDestination[] = [
  {
    id: "business-profile",
    kind: "page",
    label: "Business profile",
    href: "/settings/business-profile",
    keywords: "business profile icp target customer scoring",
    icon: Building2,
    availability: "available",
    description: "Define the customers, buyers, and sales motion used for ICP fit scoring.",
  },
  {
    id: "billing",
    kind: "page",
    label: "Billing",
    href: "/billing",
    keywords: "billing credits plan invoice top up",
    icon: CreditCard,
    availability: "available",
    description: "Manage your plan, credits, invoices, and one-time top-ups.",
  },
  {
    id: "api-keys",
    kind: "page",
    label: "API Keys",
    href: "/api-keys",
    keywords: "api keys developer token",
    icon: Key,
    availability: "later",
    description: "Create and revoke keys for programmatic access.",
  },
];

export function getVisibleNavigationGroups(): DashboardNavigationGroup[] {
  return NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.availability === "available"),
  })).filter((group) => group.items.length > 0);
}

export function getVisibleSettingsDestinations(): SettingsDestination[] {
  return SETTINGS_DESTINATIONS.filter((item) => item.availability === "available");
}

function pathMatches(basePath: string, pathname: string): boolean {
  if (basePath === "/dashboard") return pathname === basePath;
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function isNavigationItemActive(
  item: Pick<DashboardNavigationItem, "href" | "activePaths">,
  pathname: string,
): boolean {
  return (item.activePaths ?? [item.href]).some((path) => pathMatches(path, pathname));
}

export function getNavigationItemForPath(pathname: string): DashboardNavigationItem | undefined {
  return NAVIGATION_GROUPS
    .flatMap((group) => group.items)
    .find((item) => isNavigationItemActive(item, pathname));
}

export interface NavigationBreadcrumb {
  parent: string;
  current: string;
  icon: LucideIcon;
}

export function getNavigationBreadcrumb(pathname: string): NavigationBreadcrumb {
  const settingsDestination = SETTINGS_DESTINATIONS.find((item) => pathMatches(item.href, pathname));
  if (settingsDestination) {
    return { parent: "Settings", current: settingsDestination.label, icon: settingsDestination.icon };
  }

  for (const group of NAVIGATION_GROUPS) {
    const item = group.items.find((candidate) => pathMatches(candidate.href, pathname));
    if (item) return { parent: group.label, current: item.label, icon: item.icon };
  }

  return { parent: "Workspace", current: "VesperWise", icon: LayoutGrid };
}

export const SEARCH_NAV_ITEMS: SearchNavItem[] = getVisibleNavigationGroups()
  .flatMap((group) => group.items)
  .map(({ id, kind, label, href, keywords, icon }) => ({ id, kind, label, href, keywords, icon }));

export function filterNavItems(query: string): SearchNavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SEARCH_NAV_ITEMS;
  return SEARCH_NAV_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q) ||
      item.href.toLowerCase().includes(q),
  );
}

export function getNavItem(id: string): SearchNavItem | undefined {
  return SEARCH_NAV_ITEMS.find((item) => item.id === id);
}

export const SEARCH_OPEN_EVENT = "dashboard-search-open";

export function openDashboardSearch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SEARCH_OPEN_EVENT));
  }
}
