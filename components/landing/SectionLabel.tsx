"use client";

export default function SectionLabel({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span
      className={`inline-block font-sans text-[12px] font-semibold uppercase tracking-[0.22em] text-[#e8ff40] md:text-[13px] ${className}`}
    >
      {text}
    </span>
  );
}
