"use client";

export default function SectionLabel({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`inline-block text-cyan-400 text-sm tracking-[0.25em] uppercase ${className}`}>
      [{text}]
    </span>
  );
}
