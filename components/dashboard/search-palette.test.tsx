// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchPalette } from "./search-palette";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
}));

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  navigation.push.mockReset();
});

describe("search palette accessibility", () => {
  it("labels its combobox and active option for assistive technology", async () => {
    render(<SearchPalette open onOpenChange={vi.fn()} />);

    const combobox = await screen.findByRole("combobox", { name: "Search companies, people, and pages" });
    const options = await screen.findAllByRole("option");
    expect(combobox).toHaveAttribute("aria-controls", "dashboard-search-results");
    expect(combobox).toHaveAttribute("aria-activedescendant", options[0].id);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("traps focus, closes on Escape, restores focus, and unlocks scrolling", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open search</button>
          <SearchPalette
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
          />
        </>
      );
    }
    render(<Harness />);

    const opener = screen.getByRole("button", { name: "Open search" });
    await user.click(opener);
    const combobox = await screen.findByRole("combobox", { name: "Search companies, people, and pages" });
    await waitFor(() => expect(combobox).toHaveFocus());
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Close search" })).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(opener).toHaveFocus();
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });

  it("navigates the selected command with the keyboard", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<SearchPalette open onOpenChange={onOpenChange} />);

    const combobox = await screen.findByRole("combobox", { name: "Search companies, people, and pages" });
    await user.type(combobox, "inbox");
    await user.keyboard("{Enter}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigation.push).toHaveBeenCalledWith("/inbox");
  });

  it("scrolls the active option into view during extended keyboard navigation", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    render(<SearchPalette open onOpenChange={vi.fn()} />);

    const combobox = await screen.findByRole("combobox", { name: "Search companies, people, and pages" });
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    const activeId = combobox.getAttribute("aria-activedescendant");
    const activeOption = activeId ? document.getElementById(activeId) : null;

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(scrollIntoView.mock.instances.at(-1)).toBe(activeOption);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "nearest" });
  });
});
