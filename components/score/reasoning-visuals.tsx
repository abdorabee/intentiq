"use client";

import { cn } from "@/lib/utils";
import type { SignalSet, BuyingStage, UrgencyLevel, IntentSignalKey, SignalContribution } from "@/lib/types";
import {
  DollarSign,
  Users,
  Newspaper,
  Cpu,
  Activity,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

// ─── Signal Radar Chart (pure SVG) ──────────────────────────────────────────

const SIGNAL_META: Array<{
  key: IntentSignalKey;
  label: string;
  icon: typeof DollarSign;
  color: string;
  lightColor: string;
}> = [
  { key: "funding", label: "Funding", icon: DollarSign, color: "rgb(6,182,212)", lightColor: "rgb(8,145,178)" },
  { key: "hiring", label: "Hiring", icon: Users, color: "rgb(16,185,129)", lightColor: "rgb(5,150,105)" },
  { key: "news", label: "News", icon: Newspaper, color: "rgb(245,158,11)", lightColor: "rgb(217,119,6)" },
  { key: "technology", label: "Tech", icon: Cpu, color: "rgb(59,130,246)", lightColor: "rgb(37,99,235)" },
  { key: "web_activity", label: "Web", icon: Activity, color: "rgb(168,85,247)", lightColor: "rgb(147,51,234)" },
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function SignalRadarChart({ signals }: { signals: SignalSet }) {
  const signalMeta = SIGNAL_META.filter((item) => signals[item.key] !== undefined);
  const cx = 100,
    cy = 100,
    maxR = 75;
  const count = signalMeta.length;
  const angleStep = 360 / count;

  // Compute percentage for each signal
  const values = signalMeta.map((m) => {
    const sig = signals[m.key]!;
    return sig.score / sig.max;
  });

  // Build polygon points
  const points = values
    .map((v, i) => {
      const angle = i * angleStep;
      const r = v * maxR;
      const { x, y } = polarToCartesian(cx, cy, r, angle);
      return `${x},${y}`;
    })
    .join(" ");

  // Concentric rings
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      <svg viewBox="0 0 200 200" className="w-full max-w-[240px] mx-auto">
        {/* Background rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={Array.from({ length: count }, (_, i) => {
              const { x, y } = polarToCartesian(cx, cy, r * maxR, i * angleStep);
              return `${x},${y}`;
            }).join(" ")}
            fill="none"
            className="stroke-slate-300/15 dark:stroke-foreground/[0.06]"
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines */}
        {signalMeta.map((_, i) => {
          const { x, y } = polarToCartesian(cx, cy, maxR, i * angleStep);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              className="stroke-slate-300/10 dark:stroke-foreground/[0.04]"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={points}
          fill="rgba(6,182,212,0.12)"
          stroke="rgba(6,182,212,0.6)"
          strokeWidth="1.5"
          className="transition-all duration-700"
        />

        {/* Data points */}
        {values.map((v, i) => {
          const angle = i * angleStep;
          const r = v * maxR;
          const { x, y } = polarToCartesian(cx, cy, r, angle);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={signalMeta[i].color}
              stroke="#000"
              strokeWidth="0.5"
              className="dark:stroke-black stroke-white"
            />
          );
        })}

        {/* Labels */}
        {signalMeta.map((m, i) => {
          const { x, y } = polarToCartesian(cx, cy, maxR + 16, i * angleStep);
          return (
            <text
              key={m.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500 dark:fill-slate-500 text-[7px] font-medium"
            >
              {m.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Signal Contribution Donut ──────────────────────────────────────────────

export function SignalDonut({
  signals,
  totalScore,
  contributions,
}: {
  signals: SignalSet;
  totalScore: number;
  contributions: SignalContribution[];
}) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const segments = SIGNAL_META
    .filter((item) => signals[item.key] !== undefined)
    .reduce<
    Array<ReturnType<typeof Object.assign> & { score: number; pct: number; dashLength: number; offset: number }>
  >((acc, m) => {
    const sig = signals[m.key]!;
    const score = contributions.find((item) => item.type === m.key)?.contribution ?? 0;
    const pct = totalScore > 0 ? score / totalScore : 0;
    const dashLength = pct * circumference;
    const offset = acc.reduce((sum, s) => sum + s.dashLength, 0);
    acc.push({ ...m, score, pct, dashLength, offset, rawScore: sig.score });
    return acc;
  }, []);

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <svg viewBox="0 0 100 100" className="w-[120px] h-[120px]">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            className="stroke-slate-200/40 dark:stroke-foreground/[0.06]"
            strokeWidth="8"
          />
          {/* Segments */}
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="8"
              strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
              strokeDashoffset={-seg.offset}
              className="transition-all duration-700"
              transform="rotate(-90 50 50)"
            />
          ))}
          {/* Center score */}
          <text
            x="50"
            y="48"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-800 dark:fill-white text-lg font-black"
            style={{ fontSize: "18px" }}
          >
            {totalScore}
          </text>
          <text
            x="50"
            y="60"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-400 dark:fill-slate-500 text-[7px]"
            style={{ fontSize: "7px" }}
          >
            / 100
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 flex-1 min-w-0">
        {segments.map((seg) => {
          const Icon = seg.icon;
          return (
            <div key={seg.key} className="flex items-center gap-2 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <Icon className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-600" />
              <span className="text-slate-600 dark:text-slate-400 truncate">{seg.label}</span>
              <span className="ml-auto font-mono text-slate-800 dark:text-slate-300 font-medium tabular-nums">
                {seg.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Buying Journey Visualization ───────────────────────────────────────────

const BUYING_STAGES: Array<{ key: BuyingStage; label: string; description: string }> = [
  { key: "awareness", label: "Awareness", description: "Exploring problem space" },
  { key: "consideration", label: "Consideration", description: "Evaluating solutions" },
  { key: "decision", label: "Decision", description: "Ready to purchase" },
];

export function BuyingJourney({ stage }: { stage: BuyingStage }) {
  const activeIndex = BUYING_STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
        Buying Journey
      </p>
      <div className="flex items-center gap-1">
        {BUYING_STAGES.map((s, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <div key={s.key} className="flex items-center flex-1 min-w-0">
              <div
                className={cn(
                  "flex-1 px-3 py-2.5 border transition-all duration-300 text-center",
                  isActive
                    ? "bg-cyan-500/15 border-cyan-500/40 dark:bg-cyan-500/10 dark:border-cyan-500/30"
                    : isPast
                    ? "bg-emerald-500/10 border-emerald-500/25 dark:bg-emerald-500/8 dark:border-emerald-500/20"
                    : "bg-slate-100 dark:bg-foreground/[0.02] border-slate-200 dark:border-foreground/[0.06]"
                )}
              >
                <p
                  className={cn(
                    "text-[11px] font-bold tracking-wide",
                    isActive
                      ? "text-cyan-600 dark:text-cyan-400"
                      : isPast
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-600"
                  )}
                >
                  {s.label}
                </p>
                <p
                  className={cn(
                    "text-[9px] mt-0.5 hidden sm:block",
                    isActive
                      ? "text-cyan-500/70 dark:text-cyan-500/50"
                      : isPast
                      ? "text-emerald-500/60"
                      : "text-slate-300 dark:text-slate-700"
                  )}
                >
                  {s.description}
                </p>
              </div>
              {i < BUYING_STAGES.length - 1 && (
                <ArrowRight
                  className={cn(
                    "h-3 w-3 shrink-0 mx-0.5",
                    isPast ? "text-emerald-500/40" : "text-slate-300 dark:text-slate-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Urgency Meter ──────────────────────────────────────────────────────────

const URGENCY_LEVELS: Array<{
  key: UrgencyLevel;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
}> = [
  {
    key: "nurture",
    label: "Nurture",
    color: "rgb(100,116,139)",
    bgClass: "bg-slate-500",
    textClass: "text-slate-500",
  },
  {
    key: "this-month",
    label: "This Month",
    color: "rgb(59,130,246)",
    bgClass: "bg-blue-500",
    textClass: "text-blue-500",
  },
  {
    key: "this-week",
    label: "This Week",
    color: "rgb(245,158,11)",
    bgClass: "bg-amber-500",
    textClass: "text-amber-500",
  },
  {
    key: "act-now",
    label: "Act Now",
    color: "rgb(239,68,68)",
    bgClass: "bg-red-500",
    textClass: "text-red-500",
  },
];

export function UrgencyMeter({ urgency }: { urgency: UrgencyLevel }) {
  const activeIndex = URGENCY_LEVELS.findIndex((u) => u.key === urgency);
  const activeLevel = URGENCY_LEVELS[activeIndex];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
          Urgency
        </p>
        <div className="flex items-center gap-1.5">
          {activeIndex >= 2 && (
            <AlertTriangle className={cn("h-3 w-3", activeLevel.textClass)} />
          )}
          <span className={cn("text-xs font-bold", activeLevel.textClass)}>
            {activeLevel.label}
          </span>
        </div>
      </div>

      {/* Meter bar */}
      <div className="flex gap-1 h-2">
        {URGENCY_LEVELS.map((level, i) => (
          <div
            key={level.key}
            className={cn(
              "flex-1 transition-all duration-500",
              i <= activeIndex
                ? `${level.bgClass} opacity-${i === activeIndex ? "100" : "40"}`
                : "bg-slate-200 dark:bg-foreground/[0.04]"
            )}
            style={{
              opacity: i <= activeIndex ? (i === activeIndex ? 1 : 0.4) : undefined,
              backgroundColor: i <= activeIndex ? level.color : undefined,
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        <span className="text-[9px] text-slate-400 dark:text-slate-700">Low</span>
        <span className="text-[9px] text-slate-400 dark:text-slate-700">Critical</span>
      </div>
    </div>
  );
}

// ─── Enhanced Key Triggers ──────────────────────────────────────────────────

export function KeyTriggersVisual({ triggers }: { triggers: string[] }) {
  if (!triggers || triggers.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
        Key Triggers
      </p>
      <div className="space-y-1.5">
        {triggers.map((trigger, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 px-3 py-2.5 border transition-all",
              "bg-slate-50 dark:bg-foreground/[0.02] border-slate-200 dark:border-foreground/[0.06]"
            )}
          >
            {/* Priority indicator */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                  i === 0
                    ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                    : i === 1
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    : "bg-slate-200 dark:bg-foreground/[0.06] text-slate-500 dark:text-slate-500 border border-slate-300 dark:border-foreground/[0.08]"
                )}
              >
                {i + 1}
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{trigger}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
