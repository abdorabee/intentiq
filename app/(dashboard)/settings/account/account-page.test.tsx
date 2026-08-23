// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs", () => ({ UserProfile: () => <div data-testid="clerk-user-profile" /> }));

import AccountSettingsPage from "./page";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("AccountSettingsPage capability boundary", () => {
  it("does not mount Clerk account management while lifecycle deletion is unverified", () => {
    render(<AccountSettingsPage />);
    expect(screen.queryByTestId("clerk-user-profile")).not.toBeInTheDocument();
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
  });

  it("mounts full Clerk account management only for the explicit verified contract", () => {
    vi.stubEnv("CLERK_USER_LIFECYCLE_SYNC_ENABLED", "true");
    vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", "whsec_test");
    vi.stubEnv("CLERK_USER_LIFECYCLE_CONTRACT", "vesperwise-clerk-lifecycle-v1");
    render(<AccountSettingsPage />);
    expect(screen.getByTestId("clerk-user-profile")).toBeInTheDocument();
  });
});
