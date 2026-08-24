"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import {
  PRODUCT_TOUR_RESTART_EVENT,
  PRODUCT_TOUR_STEPS,
  PRODUCT_TOUR_TARGET_IDS,
  clampTourIndex,
  isLastTourStep,
  isScoreWorkspacePath,
  isTourDismissKey,
  nextFocusIndex,
  nextTourIndex,
  padTourRect,
  placeTourCard,
  previousTourIndex,
  productTourCompletionPatch,
  resolveTourTarget,
  shouldStartProductTour,
  visibleTourSteps,
  type ProductTourTargetId,
  type TourRect,
  type TourViewport,
} from "@/lib/product-tour";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function readTargetRect(id: ProductTourTargetId): TourRect | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`);
  const el = nodes[nodes.length - 1];
  if (!el) return null;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return null;
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function measureTargets(): Record<ProductTourTargetId, TourRect | null> {
  const next = {} as Record<ProductTourTargetId, TourRect | null>;
  for (const id of PRODUCT_TOUR_TARGET_IDS) {
    next[id] = readTargetRect(id);
  }
  return next;
}

function readViewport(): TourViewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function ProductTour() {
  const pathname = usePathname();
  const cardRef = useRef<HTMLDivElement>(null);
  const persistedRef = useRef(false);
  const pendingRestartRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [targets, setTargets] = useState<Partial<Record<ProductTourTargetId, TourRect | null>>>({});
  const [viewport, setViewport] = useState<TourViewport>({ width: 0, height: 0 });
  const [cardSize, setCardSize] = useState({ width: 320, height: 168 });

  const visible = visibleTourSteps(PRODUCT_TOUR_STEPS, targets, viewport);
  const currentIndex = clampTourIndex(index, visible.length);
  const current = visible[currentIndex];
  const resolved = current ? resolveTourTarget(current, targets, viewport) : null;
  const last = isLastTourStep(currentIndex, visible.length);

  const refreshMetrics = useCallback(() => {
    setTargets(measureTargets());
    setViewport(readViewport());
    const card = cardRef.current;
    if (card) {
      const rect = card.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCardSize({ width: rect.width, height: rect.height });
      }
    }
  }, []);

  const persistCompletion = useCallback(async () => {
    if (persistedRef.current) return;
    persistedRef.current = true;
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productTourCompletionPatch()),
      });
      if (!response.ok) persistedRef.current = false;
    } catch {
      persistedRef.current = false;
    }
  }, []);

  const closeAndPersist = useCallback(() => {
    setOpen(false);
    void persistCompletion();
  }, [persistCompletion]);

  const startTour = useCallback(() => {
    persistedRef.current = false;
    setIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onRestart() {
      pendingRestartRef.current = true;
      if (isScoreWorkspacePath(pathname)) {
        pendingRestartRef.current = false;
        startTour();
      }
    }
    window.addEventListener(PRODUCT_TOUR_RESTART_EVENT, onRestart);
    return () => window.removeEventListener(PRODUCT_TOUR_RESTART_EVENT, onRestart);
  }, [pathname, startTour]);

  useEffect(() => {
    if (pendingRestartRef.current && isScoreWorkspacePath(pathname)) {
      pendingRestartRef.current = false;
      startTour();
    }
  }, [pathname, startTour]);

  useEffect(() => {
    if (open || persistedRef.current || !isScoreWorkspacePath(pathname)) return;
    let cancelled = false;
    fetch("/api/user/preferences")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { preferences?: { product_tour_completed?: boolean } } | null) => {
        if (cancelled || !data) return;
        if (shouldStartProductTour(data.preferences, pathname)) startTour();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, pathname, startTour]);

  useEffect(() => {
    if (!open) return;
    refreshMetrics();
    const onReposition = () => refreshMetrics();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    const interval = window.setInterval(refreshMetrics, 250);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      window.clearInterval(interval);
    };
  }, [open, pathname, currentIndex, refreshMetrics]);

  useEffect(() => {
    if (!isScoreWorkspacePath(pathname) && open && !pendingRestartRef.current) {
      setOpen(false);
    }
  }, [pathname, open]);

  useEffect(() => {
    if (!open || !current) return;
    const card = cardRef.current;
    const preferred = card?.querySelector<HTMLElement>("[data-tour-primary]");
    (preferred ?? card)?.focus();
  }, [open, current, currentIndex]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (isTourDismissKey(event.key)) {
        event.preventDefault();
        closeAndPersist();
        return;
      }
      if (event.key !== "Tab") return;
      const card = cardRef.current;
      if (!card) return;
      const nodes = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
      );
      if (nodes.length === 0) {
        event.preventDefault();
        card.focus();
        return;
      }
      const currentFocus = nodes.findIndex((el) => el === document.activeElement);
      event.preventDefault();
      const next = nextFocusIndex(currentFocus, nodes.length, event.shiftKey);
      nodes[next]?.focus();
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, closeAndPersist]);

  if (!mounted || !open || !current || !resolved) return null;

  const spotlight = padTourRect(resolved.rect);
  const cardPos = placeTourCard(spotlight, cardSize, viewport);

  return createPortal(
    <div className="product-tour" data-product-tour="">
      <div className="product-tour-scrim" aria-hidden="true" />
      <div
        className="product-tour-spotlight"
        aria-hidden="true"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
      />
      <div
        ref={cardRef}
        className="product-tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-tour-title"
        aria-describedby="product-tour-body"
        tabIndex={-1}
        style={{ top: cardPos.top, left: cardPos.left }}
      >
        <p className="product-tour-progress">
          {currentIndex + 1} / {visible.length}
        </p>
        <h2 id="product-tour-title">{current.title}</h2>
        <p id="product-tour-body">{current.body}</p>
        <div className="product-tour-actions">
          <button type="button" className="tb-btn outlined" onClick={closeAndPersist}>
            Skip
          </button>
          <div className="product-tour-actions-end">
            <button
              type="button"
              className="tb-btn outlined"
              onClick={() => setIndex((value) => previousTourIndex(value))}
              disabled={currentIndex === 0}
            >
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              data-tour-primary=""
              onClick={() => {
                if (last) {
                  closeAndPersist();
                  return;
                }
                setIndex((value) => nextTourIndex(value, visible.length));
              }}
            >
              {last ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
