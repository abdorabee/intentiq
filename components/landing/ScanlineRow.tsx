"use client";

import { forwardRef } from "react";

interface ScanlineRowProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}

const ScanlineRow = forwardRef<HTMLDivElement, ScanlineRowProps>(
  ({ left, right, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`scanline-hover flex items-center justify-between py-6 px-4 md:px-8 border-b border-dashed border-white/[0.08] cursor-default ${className}`}
      >
        <div className="flex-1 min-w-0">{left}</div>
        <div className="flex-shrink-0 ml-4">{right}</div>
      </div>
    );
  }
);

ScanlineRow.displayName = "ScanlineRow";

export default ScanlineRow;
