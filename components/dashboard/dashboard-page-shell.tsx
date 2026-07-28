import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardPageShell({
  eyebrow,
  title,
  description,
  children,
  className,
  maxWidthClass = "max-w-5xl",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  maxWidthClass?: string;
}) {
  return (
    <div className={cn("mx-auto w-full space-y-8 px-5 pb-10 pt-6 lg:px-7", maxWidthClass, className)}>
      <header className="page-head">
        <div>
          <p className="mb-2 font-mono text-[11px] font-semibold text-[#e8ff40]">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          {description ? <p className="page-sub">{description}</p> : null}
        </div>
      </header>
      {children}
    </div>
  );
}
