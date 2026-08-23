// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { NAVIGATION_MANIFEST, type DashboardNavigationItem } from "@/lib/dashboard-search";
import SiteFooter from "./site-footer";

afterEach(cleanup);

function findManifestItem(id: string): DashboardNavigationItem | undefined {
  const visit = (items: readonly DashboardNavigationItem[]): DashboardNavigationItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      const child = item.children ? visit(item.children) : undefined;
      if (child) return child;
    }
    return undefined;
  };
  for (const group of NAVIGATION_MANIFEST) {
    const item = visit(group.items);
    if (item) return item;
  }
  return undefined;
}

describe("SiteFooter canonical destinations", () => {
  it("uses the recursive manifest destination for Intent Hub", () => {
    const pipeline = findManifestItem("pipeline");
    expect(pipeline?.availability).toBe("available");
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: "Intent Hub" })).toHaveAttribute("href", pipeline?.href);
  });
});
