const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function focusTourDialog(dialog: HTMLElement): HTMLElement | null {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const initial = dialog.querySelector<HTMLElement>("[data-tour-initial-focus]") ?? dialog;
  initial.focus();
  return previous;
}

export function restoreTourFocus(previous: HTMLElement | null) {
  if (previous?.isConnected) previous.focus();
}

export function trapTourTabKey(dialog: HTMLElement, event: KeyboardEvent): boolean {
  if (event.key !== "Tab") return false;
  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hasAttribute("disabled"));
  if (focusable.length === 0) {
    event.preventDefault();
    dialog.focus();
    return true;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !dialog.contains(active) || !focusable.includes(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return true;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}
