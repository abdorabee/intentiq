"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Gauge, Search, X } from "lucide-react";
import {
  filterNavItems,
  type SearchNavItem,
  type SearchResultItem,
} from "@/lib/dashboard-search";

interface SearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RemoteResults {
  companies: SearchResultItem[];
  people: SearchResultItem[];
  watchlist: SearchResultItem[];
  lists: SearchResultItem[];
}

const EMPTY: RemoteResults = {
  companies: [],
  people: [],
  watchlist: [],
  lists: [],
};

type PaletteRow =
  | { type: "page"; item: SearchNavItem }
  | { type: "result"; item: SearchResultItem };

interface PaletteSection {
  title: string;
  rows: PaletteRow[];
}

function bandClass(band?: SearchResultItem["band"]) {
  if (band === "HOT") return "band-hot";
  if (band === "WARM") return "band-warm";
  if (band === "COLD") return "band-cold";
  return "";
}

const itemClass =
  "cmd-item flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-[var(--text-primary)]";
const itemActiveClass = "active";

export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [remote, setRemote] = useState<RemoteResults>(EMPTY);
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmedQuery = query.trim();
  const pages = useMemo(() => filterNavItems(query), [query]);

  const scoreAction = useMemo((): SearchResultItem | null => {
    if (trimmedQuery.length < 2) return null;
    return {
      id: "action-score",
      kind: "action",
      label: `Score ${trimmedQuery}`,
      sublabel: "Run a new intent score",
      href: `/score?domain=${encodeURIComponent(trimmedQuery)}`,
    };
  }, [trimmedQuery]);

  const sections = useMemo((): PaletteSection[] => {
    const out: PaletteSection[] = [];

    if (pages.length) {
      out.push({
        title: "Pages",
        rows: pages.map((item) => ({ type: "page", item })),
      });
    }

    if (trimmedQuery.length >= 2) {
      if (remote.companies.length) {
        out.push({
          title: "Companies",
          rows: remote.companies.map((item) => ({ type: "result", item })),
        });
      }
      if (remote.watchlist.length) {
        out.push({
          title: "Watchlist",
          rows: remote.watchlist.map((item) => ({ type: "result", item })),
        });
      }
      if (remote.people.length) {
        out.push({
          title: "People",
          rows: remote.people.map((item) => ({ type: "result", item })),
        });
      }
      if (remote.lists.length) {
        out.push({
          title: "Lists",
          rows: remote.lists.map((item) => ({ type: "result", item })),
        });
      }
      if (scoreAction) {
        out.push({
          title: "Actions",
          rows: [{ type: "result", item: scoreAction }],
        });
      }
    }

    return out;
  }, [pages, remote, trimmedQuery, scoreAction]);

  const flatRows = useMemo(() => sections.flatMap((s) => s.rows), [sections]);
  const activeOptionId = flatRows[activeIndex]
    ? `dashboard-search-option-${activeIndex}`
    : undefined;

  const closePalette = useCallback(() => {
    setQuery("");
    setRemote(EMPTY);
    setLoading(false);
    setActiveIndex(0);
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const focusableSelector = [
      "button:not([disabled]):not([tabindex='-1'])",
      "input:not([disabled])",
      "a[href]",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    function onDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onDialogKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [closePalette, open]);

  useEffect(() => {
    if (!open) return;
    if (trimmedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/dashboard/search?q=${encodeURIComponent(trimmedQuery)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data: RemoteResults) => {
          if (!controller.signal.aborted) setRemote(data);
        })
        .catch(() => {
          if (!controller.signal.aborted) setRemote(EMPTY);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmedQuery, open]);

  useEffect(() => {
    if (!open || !activeOptionId) return;
    document.getElementById(activeOptionId)?.scrollIntoView?.({ block: "nearest" });
  }, [activeOptionId, open]);

  const selectRow = useCallback(
    (row: PaletteRow) => {
      closePalette();
      router.push(row.type === "page" ? row.item.href : row.item.href);
    },
    [closePalette, router],
  );

  function onQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
    if (value.trim().length < 2) {
      setRemote(EMPTY);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(flatRows.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatRows[activeIndex]) {
      e.preventDefault();
      selectRow(flatRows[activeIndex]);
    }
  }

  if (!open || typeof document === "undefined") return null;

  const showEmpty =
    !loading &&
    flatRows.length === 0 &&
    (trimmedQuery.length >= 2 || pages.length === 0);

  let rowIndex = -1;
  const palette = (
    <div className="cmd-backdrop" onClick={closePalette} role="presentation">
      <div
        ref={dialogRef}
        className="cmd-palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="cmd-input-row flex items-center gap-2.5 px-4 py-3.5">
          <Search className="ic h-4 w-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Search companies, people, and pages"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="dashboard-search-results"
            aria-activedescendant={activeOptionId}
            className="cmd-input min-w-0 flex-1 border-none bg-transparent text-[15px] text-[var(--text-primary)] outline-none"
            placeholder="Search companies, people, pages…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="cmd-close" onClick={closePalette} aria-label="Close search">
            <X aria-hidden />
          </button>
        </div>

        <div id="dashboard-search-results" className="cmd-results" role="listbox" aria-label="Search results">
          {showEmpty && (
            <div className="cmd-empty" role="status">
              {trimmedQuery.length >= 2
                ? "No results — try a domain or page name"
                : "Type to search or pick a page"}
            </div>
          )}

          {sections.map((section) => (
            <div key={section.title} className="cmd-group flex flex-col gap-0.5" role="group" aria-label={section.title}>
              <div className="cmd-group-label">{section.title}</div>
              {section.rows.map((row) => {
                rowIndex += 1;
                const idx = rowIndex;
                const active = idx === activeIndex;
                const Icon =
                  row.type === "page"
                    ? row.item.icon
                    : row.item.kind === "action"
                      ? Gauge
                      : null;

                const label = row.type === "page" ? row.item.label : row.item.label;
                const sublabel = row.type === "page" ? undefined : row.item.sublabel;
                const meta = row.type === "page" ? undefined : row.item.meta;
                const band = row.type === "page" ? undefined : row.item.band;
                const key = row.type === "page" ? row.item.id : row.item.id;

                return (
                  <button
                    key={key}
                    id={`dashboard-search-option-${idx}`}
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={active}
                    className={`${itemClass}${active ? ` ${itemActiveClass}` : ""}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectRow(row)}
                  >
                    {Icon && (
                      <Icon
                        className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]"
                        aria-hidden
                      />
                    )}
                    <span className="cmd-item-label min-w-0 flex-1 truncate">{label}</span>
                    {sublabel && (
                      <span className="cmd-item-sub max-w-[45%] truncate text-xs text-[var(--text-tertiary)]">
                        {sublabel}
                      </span>
                    )}
                    {meta && (
                      <span className={`cmd-item-meta shrink-0 font-mono text-xs ${bandClass(band)}`}>
                        {meta}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {loading && trimmedQuery.length >= 2 && (
            <div className="cmd-empty" role="status">Searching…</div>
          )}
        </div>

        <div className="cmd-foot">
          <span>
            <kbd className="kbd">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="kbd">↵</kbd> open
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(palette, document.body);
}
