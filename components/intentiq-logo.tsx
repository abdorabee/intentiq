"use client";

import { useId } from "react";

interface IntentIQLogoProps {
  className?: string;
  size?: number;
}

export default function IntentIQLogo({ className, size = 24 }: IntentIQLogoProps) {
  const gradId = `iq-logo-g-${useId().replace(/:/g, "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="50" y1="6" x2="50" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <line x1="50" y1="50" x2="50" y2="16" stroke={`url(#${gradId})`} strokeWidth="3.2" strokeLinecap="round" opacity="0.55" />
      <line x1="50" y1="50" x2="82.34" y2="39.49" stroke={`url(#${gradId})`} strokeWidth="3.2" strokeLinecap="round" opacity="0.55" />
      <line x1="50" y1="50" x2="69.98" y2="77.51" stroke={`url(#${gradId})`} strokeWidth="3.2" strokeLinecap="round" opacity="0.55" />
      <line x1="50" y1="50" x2="30.02" y2="77.51" stroke={`url(#${gradId})`} strokeWidth="3.2" strokeLinecap="round" opacity="0.55" />
      <line x1="50" y1="50" x2="17.66" y2="39.49" stroke={`url(#${gradId})`} strokeWidth="3.2" strokeLinecap="round" opacity="0.55" />
      <circle cx="50" cy="16" r="6.5" fill={`url(#${gradId})`} />
      <circle cx="82.34" cy="39.49" r="6.5" fill={`url(#${gradId})`} />
      <circle cx="69.98" cy="77.51" r="6.5" fill={`url(#${gradId})`} />
      <circle cx="30.02" cy="77.51" r="6.5" fill={`url(#${gradId})`} />
      <circle cx="17.66" cy="39.49" r="6.5" fill={`url(#${gradId})`} />
      <circle cx="50" cy="50" r="13" fill={`url(#${gradId})`} />
    </svg>
  );
}
