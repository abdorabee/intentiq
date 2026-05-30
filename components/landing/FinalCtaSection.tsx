import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] px-5 py-24 md:px-8 md:py-32">
      <div className="landing-hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="landing-hero-radial pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          <span className="text-gradient">Set the pace</span>
          <br />
          <span className="text-gradient">of your pipeline.</span>
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[#8a8f98]">
          Every day you wait, a competitor scores your best prospects and books the meeting first.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#8b87ff] via-[#5e6ad2] to-[#4e5acb] px-6 py-3 text-[15px] font-medium text-white shadow-[0_10px_36px_rgba(94,106,210,0.42)] hover:brightness-110"
          >
            Start scoring free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-full border border-white/[0.18] px-6 py-3 text-[15px] font-medium text-[#e8eaed] hover:border-white/[0.28] hover:bg-white/[0.05]"
          >
            Talk to sales
          </Link>
        </div>
        <p className="mt-6 font-mono text-[12px] tracking-wide text-[#62666d]">
          20 FREE CREDITS · NO CARD · &lt; 3s TO FIRST SCORE
        </p>
      </div>
    </section>
  );
}
