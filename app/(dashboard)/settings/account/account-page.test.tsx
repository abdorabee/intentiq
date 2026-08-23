// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs", () => ({ UserProfile: () => <div data-testid="clerk-user-profile" /> }));
const readiness = vi.hoisted(() => ({ enabled: false }));
vi.mock("@/lib/clerk-account-capability", () => ({
  isClerkAccountManagementReady: vi.fn(async () => readiness.enabled),
}));

import AccountSettingsPage from "./page";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("AccountSettingsPage capability boundary", () => {
  it("does not mount Clerk account management while lifecycle deletion is unverified", async () => {
    readiness.enabled = false;
    render(await AccountSettingsPage());
    expect(screen.queryByTestId("clerk-user-profile")).not.toBeInTheDocument();
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  it("mounts full Clerk account management only after database-backed readiness succeeds", async () => {
    readiness.enabled = true;
    render(await AccountSettingsPage());
    expect(screen.getByTestId("clerk-user-profile")).toBeInTheDocument();
  });
});
