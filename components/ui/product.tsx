import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ProductPage({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("page", className)}>
      <header className="page-head">
        <div>
          {eyebrow ? (
            <div className="mb-2 font-mono text-[11px] font-semibold text-[var(--accent-2)]">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="page-title">{title}</h1>
          {description ? <p className="page-sub">{description}</p> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function ProductPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      {(title || description || action) && (
        <header className="panel-head">
          <div>
            {title ? <div className="title">{title}</div> : null}
            {description ? <div className="sub">{description}</div> : null}
          </div>
          {action ? <div className="ml-auto">{action}</div> : null}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "hot" | "warm" | "cold";
}) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className={cn("num", tone !== "default" && tone)}>{value}</div>
      {detail ? <div className="delta">{detail}</div> : null}
    </div>
  );
}

export function StateView({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("inbox-empty", className)}>
      {icon ? <div className="ap-coming-soon-icon">{icon}</div> : null}
      <div className="title">{title}</div>
      {description ? <div className="sub">{description}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "cold",
}: {
  children: ReactNode;
  tone?: "hot" | "warm" | "cold" | "blue";
}) {
  return (
    <span className={cn("band", `band-${tone}`)}>
      <span className="dot" />
      {children}
    </span>
  );
}

export function ScoreMeter({
  value,
  label = "Intent score",
  tone = "hot",
}: {
  value: number;
  label?: string;
  tone?: "hot" | "warm" | "cold";
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="score-ring" aria-label={`${label}: ${pct} out of 100`}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="42" stroke="var(--border)" strokeWidth="6" fill="none" />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke={`var(--${tone})`}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 42}
          strokeDashoffset={(2 * Math.PI * 42) * (1 - pct / 100)}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>
      <div className="score-ring-center">
        <div className="score-ring-num">{pct}</div>
        <div className="score-ring-of">{label}</div>
      </div>
    </div>
  );
}

