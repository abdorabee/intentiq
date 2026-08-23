// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import {
  focusTourDialog,
  restoreTourFocus,
  trapTourTabKey,
} from "./product-tour-focus";

describe("tour focus utilities", () => {
  it("moves focus to the labelled dialog heading and restores the prior control", () => {
    document.body.innerHTML = `
      <button id="origin">Open</button>
      <section id="tour" tabindex="-1">
        <h2 data-tour-initial-focus tabindex="-1">Overview</h2>
        <button>Next</button>
      </section>
    `;
    const origin = document.querySelector<HTMLButtonElement>("#origin")!;
    const dialog = document.querySelector<HTMLElement>("#tour")!;
    origin.focus();

    const previous = focusTourDialog(dialog);
    expect(document.activeElement).toHaveTextContent("Overview");
    restoreTourFocus(previous);
    expect(origin).toHaveFocus();
  });

  it("contains forward and reverse Tab movement within tour controls", () => {
    document.body.innerHTML = `
      <section id="tour">
        <button id="first">Back</button>
        <button id="last">Next</button>
      </section>
    `;
    const dialog = document.querySelector<HTMLElement>("#tour")!;
    const first = document.querySelector<HTMLButtonElement>("#first")!;
    const last = document.querySelector<HTMLButtonElement>("#last")!;

    last.focus();
    const forward = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
    expect(trapTourTabKey(dialog, forward)).toBe(true);
    expect(first).toHaveFocus();

    first.focus();
    const reverse = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true });
    expect(trapTourTabKey(dialog, reverse)).toBe(true);
    expect(last).toHaveFocus();
  });

  it("contains Tab from the initially focused heading or an outside element", () => {
    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <section id="tour">
        <h2 id="heading" tabindex="-1">Tour</h2>
        <button id="first">Skip</button>
        <button id="last">Next</button>
      </section>
    `;
    const dialog = document.querySelector<HTMLElement>("#tour")!;
    const heading = document.querySelector<HTMLElement>("#heading")!;
    const outside = document.querySelector<HTMLButtonElement>("#outside")!;
    const first = document.querySelector<HTMLButtonElement>("#first")!;
    const last = document.querySelector<HTMLButtonElement>("#last")!;

    heading.focus();
    expect(trapTourTabKey(dialog, new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true }))).toBe(true);
    expect(last).toHaveFocus();

    outside.focus();
    expect(trapTourTabKey(dialog, new KeyboardEvent("keydown", { key: "Tab", cancelable: true }))).toBe(true);
    expect(first).toHaveFocus();
  });
});
