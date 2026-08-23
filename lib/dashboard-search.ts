import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Building2,
  Code2,
  CreditCard,
  Eye,
  Flame,
  Gauge,
  History,
  Inbox,
  LayoutGrid,
  ListChecks,
  Palette,
  ShieldCheck,
  Sparkles,
  Settings,
  Upload,
  UserCog,
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
  description?: string;
  children?: readonly DashboardNavigationItem[];
}

export interface DashboardNavigationGroup {
  id: "workspace" | "research" | "automation" | "utilities";
  label: "Workspace" | "Research" | "Automation" | "Utilities";
  items: readonly DashboardNavigationItem[];
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

export const NAVIGATION_MANIFEST: readonly DashboardNavigationGroup[] = [
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
      { id: "bulk", kind: "page", label: "Bulk Score", href: "/bulk", keywords: "bulk csv upload score companies", icon: Upload, availability: "later" },
      { id: "autopilot", kind: "page", label: "Autopilot", href: "/autopilot", keywords: "autopilot workflows automation", icon: Zap, availability: "later" },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    items: [
      { id: "inbox", kind: "page", label: "Inbox", href: "/inbox", keywords: "inbox notifications messages alerts", icon: Inbox, availability: "available", count: "inbox" },
      {
        id: "settings",
        kind: "page",
        label: "Settings",
        href: "/settings",
        keywords: "settings preferences workspace",
        icon: Settings,
        availability: "available",
        children: [
          {
            id: "account",
            kind: "page",
            label: "Account & security",
            href: "/settings/account",
            keywords: "account security identity email avatar password mfa sessions clerk",
            icon: UserCog,
            availability: "available",
            description: "Manage your identity, sign-in methods, MFA, and active sessions through Clerk.",
          },
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
            id: "appearance",
            kind: "page",
            label: "Appearance",
            href: "/settings/appearance",
            keywords: "appearance theme system light dark sidebar collapsed",
            icon: Palette,
            availability: "available",
            description: "Choose your theme and default sidebar state across signed-in devices.",
          },
          {
            id: "product-experience",
            kind: "page",
            label: "Product experience",
            href: "/settings/product-experience",
            keywords: "product experience tour onboarding guide restart",
            icon: Sparkles,
            availability: "later",
            description: "Review and restart the contextual product tour once it becomes active.",
          },
          {
            id: "developer",
            kind: "page",
            label: "Developer",
            href: "/settings/developer",
            activePaths: ["/settings/developer", "/api-keys"],
            keywords: "developer api keys token integration docs",
            icon: Code2,
            availability: "available",
            description: "Create and revoke API keys for programmatic access.",
          },
          {
            id: "data-privacy",
            kind: "page",
            label: "Data & privacy",
            href: "/settings/data-privacy",
            keywords: "data privacy analytics consent legal cookies",
            icon: ShieldCheck,
            availability: "available",
            description: "Control product analytics and review the policies that govern your data.",
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
        ],
      },
    ],
  },
];

export function getVisibleNavigationGroups(
  manifest: readonly DashboardNavigationGroup[] = NAVIGATION_MANIFEST,
): DashboardNavigationGroup[] {
  return manifest.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.availability === "available"),
  })).filter((group) => group.items.length > 0);
}

function getNavigationItemById(
  id: string,
  manifest: readonly DashboardNavigationGroup[] = NAVIGATION_MANIFEST,
): DashboardNavigationItem | undefined {
  for (const item of manifest.flatMap((group) => group.items)) {
    if (item.id === id) return item;
    const child = item.children?.find((candidate) => candidate.id === id);
    if (child) return child;
  }
  return undefined;
}

export function getVisibleSettingsDestinations(
  manifest: readonly DashboardNavigationGroup[] = NAVIGATION_MANIFEST,
): DashboardNavigationItem[] {
  return getNavigationItemById("settings", manifest)?.children
    ?.filter((item) => item.availability === "available") ?? [];
}

function pathMatches(basePath: string, pathname: string): boolean {
  if (basePath === "/dashboard") return pathname === basePath;
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function isNavigationItemActive(
  item: Pick<DashboardNavigationItem, "href" | "activePaths" | "children">,
  pathname: string,
): boolean {
  const ownedPaths = [
    ...(item.activePaths ?? [item.href]),
    ...(item.children?.map((child) => child.href) ?? []),
  ];
  return ownedPaths.some((path) => pathMatches(path, pathname));
}

export function getNavigationItemForPath(pathname: string): DashboardNavigationItem | undefined {
  return NAVIGATION_MANIFEST
    .flatMap((group) => group.items)
    .find((item) => isNavigationItemActive(item, pathname));
}

export interface NavigationBreadcrumb {
  parent: string;
  current: string;
  icon: LucideIcon;
}

export function getNavigationBreadcrumb(pathname: string): NavigationBreadcrumb {
  for (const group of NAVIGATION_MANIFEST) {
    for (const item of group.items) {
      const child = item.children?.find((candidate) => pathMatches(candidate.href, pathname));
      if (child) return { parent: item.label, current: child.label, icon: child.icon };
      if (pathMatches(item.href, pathname)) {
        return { parent: group.label, current: item.label, icon: item.icon };
      }
    }
  }

  return { parent: "Workspace", current: "VesperWise", icon: LayoutGrid };
}

function toSearchNavItem(item: DashboardNavigationItem): SearchNavItem {
  const { id, kind, label, href, keywords, icon } = item;
  return { id, kind, label, href, keywords, icon };
}

export function getSearchNavigationItems(
  manifest: readonly DashboardNavigationGroup[] = NAVIGATION_MANIFEST,
): SearchNavItem[] {
  return getVisibleNavigationGroups(manifest).flatMap((group) =>
    group.items.flatMap((item) => [
      toSearchNavItem(item),
      ...(item.children ?? [])
        .filter((child) => child.availability === "available")
        .map(toSearchNavItem),
    ]),
  );
}

export const SEARCH_NAV_ITEMS: SearchNavItem[] = getSearchNavigationItems();

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
