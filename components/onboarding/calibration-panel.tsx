"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useSyncExternalStore } from "react";

import VesperWiseLogo from "@/components/vesperwise-logo";
import type { BusinessProfile } from "@/lib/types";

import CalibrationFallback from "./calibration-fallback";
import type { CalibrationState } from "./calibration-state";

const CalibrationScene = dynamic(() => import("./calibration-scene"), {
  ssr: false,
});

const STAGE_LABELS = ["Offer", "Accounts", "Motion", "Deal"] as const;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );
}

function SignalConnector({ on, signal }: { on: boolean; signal: string }) {
  return (
    <svg
      viewBox="0 0 36 12"
      aria-hidden="true"
      focusable="false"
      className="h-3 w-9 shrink-0"
    >
      <path
        d="M 1 11 L 14 11 L 22 1 L 35 1"
        fill="none"
        stroke="#dfff00"
        strokeWidth="1.5"
        strokeLinecap="round"
        data-signal={signal}
        data-on={on || undefined}
        className="vw-signal-path"
      />
    </svg>
  );
}

function ReadoutRow({
  label,
  value,
  filled,
  signal,
}: {
  label: string;
  value: string;
  filled: boolean;
  signal?: string;
}) {
  return (
    <div
      data-readout-row
      data-filled={filled || undefined}
      className="flex items-baseline gap-3 border-t border-white/[0.06] py-2 first:border-t-0"
    >
      <span
        aria-hidden="true"
        className={`mt-px h-1.5 w-1.5 shrink-0 ${
          filled ? "bg-[#dfff00]" : "border border-white/20"
        }`}
      />
      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6f747c]">
        {label}
      </span>
      {signal && <SignalConnector on={filled} signal={signal} />}
      <span
        className={`min-w-0 truncate font-mono text-[11px] tracking-[0.02em] ${
          filled ? "text-[#e8eaed]" : "text-[#4c5057]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CalibrationPanel({
  step,
  profile,
  calibration,
  onStepSelect,
}: {
  step: number;
  profile: BusinessProfile;
  calibration: CalibrationState;
  onStepSelect: (step: number) => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [sceneOk, setSceneOk] = useState<boolean | null>(null);
  const handleSceneStatus = useCallback((ok: boolean) => setSceneOk(ok), []);

  const industriesValue =
    profile.target_industries.length > 0
      ? `${profile.target_industries.length} selected`
      : "awaiting input";

  return (
    <aside className="relative flex min-w-0 flex-col overflow-hidden border-b border-white/[0.08] bg-[#0b0c0d] lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-4 px-6 pt-6 lg:px-8 lg:pt-8">
        <VesperWiseLogo size={34} variant="wordmark" />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6f747c]">
          <span className="text-[#dfff00]">Calibration</span>{" "}
          {String(step + 1).padStart(2, "0")}/04
        </p>
      </div>

      <div className="hidden px-6 pt-6 lg:block lg:px-8">
        <h1
          data-cal-title
          className="max-w-[300px] text-[26px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#f7f8f8]"
        >
          Calibrating VesperWise to your sales motion.
        </h1>
      </div>

      {/* Persistent instrument: WebGL scene stacked over a static schematic. */}
      <div className="relative mx-auto h-44 w-full max-w-[420px] px-6 py-3 sm:h-52 lg:h-auto lg:min-h-0 lg:flex-1 lg:px-8 lg:py-4">
        <div className="relative h-full w-full" aria-hidden="true">
          <CalibrationFallback
            state={calibration}
            className={`absolute inset-0 mx-auto h-full w-full transition-opacity duration-500 ${
              sceneOk ? "opacity-0" : "opacity-100"
            }`}
          />
          {sceneOk !== false && (
            <div className="absolute inset-0">
              <CalibrationScene
                state={calibration}
                reducedMotion={reducedMotion}
                onStatusChange={handleSceneStatus}
              />
            </div>
          )}
        </div>
      </div>

      {/* Diagnostic readouts (decorative duplicate of the form state). */}
      <div aria-hidden="true" className="hidden px-8 pb-5 lg:block">
        <ReadoutRow
          label="Offer"
          value={profile.product_category.trim() || "awaiting input"}
          filled={calibration.coreInstalled}
        />
        <ReadoutRow
          label="Markets"
          value={industriesValue}
          filled={calibration.industryCount > 0}
        />
        <ReadoutRow
          label="Size"
          value={profile.company_size.trim() || "awaiting input"}
          filled={calibration.sizeIndex >= 0}
        />
        <ReadoutRow
          label="Buyer"
          value={profile.buyer_role.trim() || "awaiting input"}
          filled={calibration.buyerIndex >= 0}
          signal="buyer"
        />
        <ReadoutRow
          label="Motion"
          value={profile.sales_motion.trim() || "awaiting input"}
          filled={calibration.motionIndex >= 0}
          signal="motion"
        />
        <ReadoutRow
          label="Deal"
          value={profile.deal_size.trim() || "awaiting input"}
          filled={calibration.dealIndex >= 0}
        />
        <ReadoutRow
          label="Cycle"
          value={profile.sales_cycle.trim() || "awaiting input"}
          filled={calibration.cycleIndex >= 0}
        />
      </div>

      {/* Progress rail: assembly state of the instrument. */}
      <nav
        aria-label="Onboarding progress"
        className="border-t border-white/[0.06] px-6 py-4 lg:px-8 lg:py-5"
      >
        <ol className="flex items-stretch gap-1 lg:flex-col lg:gap-0">
          {STAGE_LABELS.map((label, index) => {
            const done = index < step;
            const current = index === step;
            return (
              <li key={label} className="flex-1 lg:flex-none">
                <button
                  type="button"
                  disabled={index > step}
                  onClick={() => onStepSelect(index)}
                  aria-current={current ? "step" : undefined}
                  data-rail-node={index}
                  data-state={current ? "current" : done ? "done" : "todo"}
                  className="group flex w-full items-center gap-3 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff00] disabled:cursor-default lg:py-2"
                >
                  <span
                    aria-hidden="true"
                    className={`h-[3px] w-full lg:h-6 lg:w-[3px] ${
                      current
                        ? "bg-[#dfff00]"
                        : done
                          ? "bg-[#dfff00]/40"
                          : "bg-white/[0.09]"
                    }`}
                  />
                  <span className="hidden items-baseline gap-2 lg:flex">
                    <span
                      className={`font-mono text-[10px] tracking-[0.14em] ${
                        current ? "text-[#dfff00]" : done ? "text-[#9298a1]" : "text-[#4c5057]"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        current
                          ? "text-[#f7f8f8]"
                          : done
                            ? "text-[#9298a1] group-hover:text-[#d7dbe0]"
                            : "text-[#4c5057]"
                      }`}
                    >
                      {label}
                    </span>
                  </span>
                  <span className="sr-only lg:hidden">
                    Step {index + 1}: {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
