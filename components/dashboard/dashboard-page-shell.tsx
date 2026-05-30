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
      <header className="border-b border-white/[0.06] pb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7170ff]">{eyebrow}</p>
        <h1 className="mt-1.5 text-[22px] font-medium tracking-[-0.024em] text-[#f7f8f8]">{title}</h1>
        {description ? <p className="mt-1 text-[13px] text-[#8a8f98]">{description}</p> : null}
      </header>
      {children}
    </div>
  );
}
