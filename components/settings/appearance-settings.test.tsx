// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const setTheme = vi.fn();
const setSidebarCollapsed = vi.fn();
const harness = vi.hoisted(() => ({ themeStatus: "idle", sidebarStatus: "idle" }));

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({ theme: "system", setTheme, preferenceStatus: harness.themeStatus }),
}));

vi.mock("@/components/dashboard/dashboard-shell", () => ({
  useDashboardShell: () => ({ collapsed: false, setSidebarCollapsed, preferenceStatus: harness.sidebarStatus }),
}));

import { AppearanceSettings } from "./appearance-settings";

afterEach(cleanup);

describe("AppearanceSettings", () => {
  it("uses the existing theme and dashboard shell authorities", async () => {
    const user = userEvent.setup();
    render(<AppearanceSettings />);

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    await user.click(screen.getByRole("radio", { name: "Collapsed" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
    expect(setSidebarCollapsed).toHaveBeenCalledWith(true);
  });

  it("surfaces persistence failures while the authorities restore saved values", () => {
    harness.themeStatus = "error";
    render(<AppearanceSettings />);
    expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
    harness.themeStatus = "idle";
  });
});
