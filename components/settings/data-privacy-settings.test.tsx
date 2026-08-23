// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ patchUserPreferences: vi.fn() }));

vi.mock("@/lib/user-preferences", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/user-preferences")>(),
  patchUserPreferences: harness.patchUserPreferences,
}));

import { ANALYTICS_CONSENT_EVENT } from "@/components/google-analytics";
import { DataPrivacySettings } from "./data-privacy-settings";

beforeEach(() => {
  harness.patchUserPreferences.mockReset();
});

afterEach(cleanup);

describe("DataPrivacySettings", () => {
  it("optimistically updates and rolls back when persistence fails", async () => {
    const user = userEvent.setup();
    let rejectWrite!: (error: Error) => void;
    harness.patchUserPreferences.mockImplementationOnce(() => new Promise<void>((_, reject) => { rejectWrite = reject; }));
    render(<DataPrivacySettings initialAnalyticsEnabled />);

    const toggle = screen.getByRole("checkbox", { name: "Product analytics" });
    await user.click(toggle);
    expect(toggle).not.toBeChecked();

    await act(async () => rejectWrite(new Error("offline")));
    await waitFor(() => expect(toggle).toBeChecked());
    expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
  });

  it("notifies the loader only after consent persists", async () => {
    const user = userEvent.setup();
    let resolveWrite!: () => void;
    harness.patchUserPreferences.mockImplementationOnce(() => new Promise<void>((resolve) => { resolveWrite = resolve; }));
    const listener = vi.fn();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, listener);
    render(<DataPrivacySettings initialAnalyticsEnabled={false} />);

    await user.click(screen.getByRole("checkbox", { name: "Product analytics" }));
    expect(listener).not.toHaveBeenCalled();

    await act(async () => resolveWrite());
    await waitFor(() => expect(listener).toHaveBeenCalledOnce());
    window.removeEventListener(ANALYTICS_CONSENT_EVENT, listener);
  });
});
