"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  ACTIVE_PRODUCT_TOUR_VERSION,
  PRODUCT_TOUR_STEPS,
  createTourClientState,
  reconcileTourVersion,
  tourProgressSchema,
  tourReducer,
  type TourAction,
  type TourProgress,
} from "@/lib/product-tour";
import { focusTourDialog, restoreTourFocus, trapTourTabKey } from "@/lib/product-tour-focus";
import { subscribeToAuthoritativeTourProgress } from "@/lib/product-tour-events";
import { getTourPosition, type TourPlacement } from "@/lib/product-tour-position";

interface ProductTourHostProps {
  initial: TourProgress;
  activeVersion?: number;
  fetcher?: typeof fetch;
  isMobile?: boolean;
  openMobileNavigation?: () => void;
  closeMobileNavigation?: () => void;
}

const SAFE_DORMANT_PROGRESS: TourProgress = {
  tour_version: 0,
  tour_status: "not_started",
  tour_step: 0,
  tour_updated_at: null,
};

export function ProductTourHost({
  initial,
  activeVersion = ACTIVE_PRODUCT_TOUR_VERSION,
  fetcher = fetch,
  isMobile = false,
  openMobileNavigation,
  closeMobileNavigation,
}: ProductTourHostProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initialValidationRef = useRef(tourProgressSchema.safeParse(initial));
  const initialProgress = initialValidationRef.current.success
    ? initialValidationRef.current.data
    : SAFE_DORMANT_PROGRESS;
  const [state, dispatch] = useReducer(tourReducer, initialProgress, createTourClientState);
  const [mounted, setMounted] = useState(false);
  const [mobileNavigationReady, setMobileNavigationReady] = useState(false);
  const [targetAvailable, setTargetAvailable] = useState(false);
  const [position, setPosition] = useState({ placement: "center" as TourPlacement, top: 16, left: 16, maxWidth: 360, maxHeight: 736 });
  const dialogRef = useRef<HTMLElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dashboardFocusPendingRef = useRef(false);
  const suppressFocusRestoreRef = useRef(false);

  const reconciliation = reconcileTourVersion(state.progress, activeVersion);
  const displayProgress = reconciliation.progress;
  const awaitingStart = displayProgress.tour_status === "not_started";
  const visible = initialValidationRef.current.success
    && reconciliation.playable
    && (displayProgress.tour_status === "in_progress" || (awaitingStart && (state.saving || Boolean(state.error))));
  const step = PRODUCT_TOUR_STEPS[displayProgress.tour_step] ?? PRODUCT_TOUR_STEPS[0];
  const onStepRoute = visible && (awaitingStart || pathname === step.route);
  const waitsForMobileNavigation = onStepRoute
    && isMobile
    && "opensMobileNavigation" in step
    && step.opensMobileNavigation;
  const targetReady = !waitsForMobileNavigation || mobileNavigationReady;

  const perform = useCallback(async (action: TourAction) => {
    if (state.saving) return;
    const expected = {
      version: state.progress.tour_version,
      status: state.progress.tour_status,
      step: state.progress.tour_step,
    };
    try {
      dispatch({ type: "transition", action, activeVersion });
      const response = await fetcher("/api/user/tour", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, expected }),
      });
      const payload = await response.json() as { tour?: unknown };
      if (response.status === 409) {
        const conflict = tourProgressSchema.safeParse(payload.tour);
        if (!conflict.success) throw new Error("conflict could not be reconciled");
        if (conflict.data.tour_status !== "in_progress") {
          suppressFocusRestoreRef.current = true;
          dashboardFocusPendingRef.current = true;
        }
        dispatch({ type: "hydrate", progress: conflict.data });
        if (conflict.data.tour_status !== "in_progress") {
          closeMobileNavigation?.();
          router.push("/dashboard");
        }
        return;
      }
      if (!response.ok) throw new Error("save failed");
      const authoritative = tourProgressSchema.parse(payload.tour);
      if (authoritative.tour_status !== "in_progress") {
        suppressFocusRestoreRef.current = true;
        dashboardFocusPendingRef.current = true;
      }
      dispatch({ type: "persisted", progress: authoritative });
      if (authoritative.tour_status !== "in_progress") {
        closeMobileNavigation?.();
        router.push("/dashboard");
      }
    } catch {
      dispatch({ type: "failed", message: "Tour progress could not be saved. Try again." });
    }
  }, [activeVersion, closeMobileNavigation, fetcher, router, state.progress, state.saving]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    return subscribeToAuthoritativeTourProgress((progress) => {
      const authoritative = tourProgressSchema.safeParse(progress);
      if (!authoritative.success || activeVersion <= 0 || authoritative.data.tour_version !== activeVersion) return;
      dispatch({ type: "hydrate", progress: authoritative.data });
    });
  }, [activeVersion]);

  useEffect(() => {
    if (!initialValidationRef.current.success || activeVersion <= 0 || state.saving || state.error) return;
    const version = reconcileTourVersion(state.progress, activeVersion);
    if (!version.playable || (state.progress.tour_version === activeVersion && state.progress.tour_status !== "not_started")) return;
    void perform("start");
  }, [activeVersion, perform, state.error, state.progress, state.saving]);

  useEffect(() => {
    if (!visible || awaitingStart || state.saving || pathname === step.route) return;
    router.push(step.route);
  }, [awaitingStart, pathname, router, state.saving, step.route, visible]);

  useEffect(() => {
    if (!dashboardFocusPendingRef.current || pathname !== "/dashboard") return;
    const frame = requestAnimationFrame(() => {
      const destination = document.querySelector<HTMLElement>('[data-tour="dashboard-overview"]')
        ?? document.getElementById("dashboard-content");
      if (!destination) return;
      destination.focus({ preventScroll: true });
      dashboardFocusPendingRef.current = false;
      suppressFocusRestoreRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, state.progress.tour_status]);

  useEffect(() => {
    if (!waitsForMobileNavigation) {
      setMobileNavigationReady(false);
      return;
    }
    openMobileNavigation?.();
    const navigation = document.getElementById("workspace-navigation");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = navigation ? getComputedStyle(navigation).transitionDuration : "0s";
    if (reducedMotion || !navigation || duration.split(",").every((value) => Number.parseFloat(value) === 0)) {
      const frame = requestAnimationFrame(() => setMobileNavigationReady(true));
      return () => cancelAnimationFrame(frame);
    }
    const finishOpening = (event: TransitionEvent) => {
      if (event.target !== navigation || event.propertyName !== "transform") return;
      setMobileNavigationReady(true);
    };
    navigation.addEventListener("transitionend", finishOpening);
    navigation.addEventListener("transitioncancel", finishOpening);
    return () => {
      navigation.removeEventListener("transitionend", finishOpening);
      navigation.removeEventListener("transitioncancel", finishOpening);
    };
  }, [openMobileNavigation, state.progress.tour_step, waitsForMobileNavigation]);

  useLayoutEffect(() => {
    if (!onStepRoute || !mounted || !targetReady) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const target = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    targetRef.current = target;
    setTargetAvailable(Boolean(target));
    target?.setAttribute("data-tour-active", "true");
    if (target && typeof target.scrollIntoView === "function") {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center", inline: "nearest" });
    }

    const updatePosition = () => {
      const targetRect = target?.getBoundingClientRect() ?? null;
      const dialogRect = dialog.getBoundingClientRect();
      setPosition(getTourPosition(
        targetRect,
        { width: dialogRect.width || 360, height: dialogRect.height || 240 },
        { width: window.innerWidth, height: window.innerHeight },
        step.placement,
      ));
    };
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(dialog);
    if (target) observer.observe(target);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      target?.removeAttribute("data-tour-active");
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      targetRef.current = null;
    };
  }, [mounted, onStepRoute, step, targetReady]);

  useLayoutEffect(() => {
    if (!onStepRoute || !targetReady) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    previousFocusRef.current = focusTourDialog(dialog);
    return () => {
      if (!suppressFocusRestoreRef.current) restoreTourFocus(previousFocusRef.current);
      previousFocusRef.current = null;
    };
  }, [displayProgress.tour_step, mounted, onStepRoute, targetReady]);

  useEffect(() => {
    if (!onStepRoute) return;
    function onKeyDown(event: KeyboardEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (event.key === "Tab") {
        trapTourTabKey(dialog, event);
        return;
      }
      if (awaitingStart) return;
      if (state.saving) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        void perform("dismiss");
      } else if (event.key === "ArrowLeft" && displayProgress.tour_step > 0) {
        event.preventDefault();
        void perform("back");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        void perform(displayProgress.tour_step === PRODUCT_TOUR_STEPS.length - 1 ? "finish" : "next");
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [awaitingStart, displayProgress.tour_step, onStepRoute, perform, state.saving]);

  if (!mounted || !onStepRoute) return null;

  return createPortal(
    <section
      ref={dialogRef}
      role="dialog"
      aria-label={`Product tour: ${step.title}`}
      aria-describedby="product-tour-description"
      tabIndex={-1}
      className="fixed z-[70] w-[calc(100vw-2rem)] border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl outline-none dark:border-white/15 dark:bg-[#111318] dark:text-white"
      data-placement={position.placement}
      style={{
        top: position.top,
        left: position.left,
        width: position.maxWidth,
        maxWidth: position.maxWidth,
        maxHeight: position.maxHeight,
        overflowY: "auto",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">{displayProgress.tour_step + 1} of {PRODUCT_TOUR_STEPS.length}</p>
          <h2 data-tour-initial-focus tabIndex={-1} className="mt-2 text-lg font-semibold outline-none">{step.title}</h2>
        </div>
        {!awaitingStart && (
          <button type="button" onClick={() => void perform("dismiss")} disabled={state.saving} aria-label="Dismiss tour" className="grid size-8 shrink-0 place-items-center text-slate-500 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 dark:hover:text-white">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <p id="product-tour-description" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
      {!targetAvailable && <p className="mt-2 text-xs text-slate-500" role="status">This guidance is shown without a page highlight while the target loads.</p>}
      {state.saving && <p role="status" aria-label="Tour progress" className="mt-3 text-sm text-slate-600 dark:text-slate-300">Saving tour progress…</p>}
      {state.error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <p className="sr-only" aria-live="polite">Step {displayProgress.tour_step + 1} of {PRODUCT_TOUR_STEPS.length}: {step.title}</p>
      {awaitingStart ? (
        state.error && (
          <div className="mt-5 flex justify-end">
            <Button type="button" onClick={() => void perform("start")} disabled={state.saving}>Retry starting tour</Button>
          </div>
        )
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void perform("skip")} disabled={state.saving} className="mr-auto px-2 py-2 text-sm text-slate-500 underline-offset-4 hover:underline disabled:opacity-50">Skip tour</button>
          {displayProgress.tour_step > 0 && (
            <Button type="button" variant="outline" onClick={() => void perform("back")} disabled={state.saving}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
          )}
          <Button type="button" onClick={() => void perform(displayProgress.tour_step === PRODUCT_TOUR_STEPS.length - 1 ? "finish" : "next")} disabled={state.saving}>
            {displayProgress.tour_step === PRODUCT_TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            {displayProgress.tour_step < PRODUCT_TOUR_STEPS.length - 1 && <ArrowRight className="size-4" aria-hidden />}
          </Button>
        </div>
      )}
    </section>,
    document.body,
  );
}
