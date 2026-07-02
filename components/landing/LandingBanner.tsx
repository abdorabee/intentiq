import Link from "next/link";

export default function LandingBanner() {
  return (
    <div className="border-b border-white/[0.05] bg-[#0a0b0d] px-4 py-1.5 text-center text-[12px] text-[#8a8f98] md:text-[13px]">
      <Link href="#autopilot" className="inline-flex items-center justify-center gap-2 hover:text-[#f7f8f8]">
        <span className="rounded-full bg-[#dfff00]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#dfff00]">
          New
        </span>
        <span>
          <strong className="font-medium text-[#f7f8f8]">Autopilot</strong> — workflows that fire when intent crosses your
          threshold
        </span>
        <span className="text-[#e8ff40]">→</span>
      </Link>
    </div>
  );
}
