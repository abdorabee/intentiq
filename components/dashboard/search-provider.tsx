"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SearchPalette } from "@/components/dashboard/search-palette";
import { SEARCH_OPEN_EVENT } from "@/lib/dashboard-search";

interface SearchContextValue {
  open: () => void;
  close: () => void;
}

interface SearchProviderProps {
  children: ReactNode;
  beforeOpen?: () => boolean;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useDashboardSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useDashboardSearch must be used within SearchProvider");
  }
  return ctx;
}

export function SearchProvider({ children, beforeOpen }: SearchProviderProps) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => {
    if (beforeOpen?.()) {
      window.setTimeout(() => setOpen(true), 0);
      return;
    }
    setOpen(true);
  }, [beforeOpen]);
  const closePalette = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) closePalette();
        else openPalette();
      }
      if (e.key === "Escape") closePalette();
    }
    function onOpenEvent() {
      openPalette();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(SEARCH_OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(SEARCH_OPEN_EVENT, onOpenEvent);
    };
  }, [closePalette, open, openPalette]);

  const value = useMemo(
    () => ({ open: openPalette, close: closePalette }),
    [openPalette, closePalette],
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      {open && <SearchPalette open onOpenChange={setOpen} />}
    </SearchContext.Provider>
  );
}
