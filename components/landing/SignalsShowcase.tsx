"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionLabel from "./SectionLabel";
import ScanlineRow from "./ScanlineRow";
import { SIGNALS } from "./data";

gsap.registerPlugin(ScrollTrigger);

export default function SignalsShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Staggered row entrance
    rowRefs.current.forEach((row) => {
      if (!row) return;
      gsap.set(row, { opacity: 0, x: -60 });
      gsap.to(row, {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: row,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });

    // Background color shift on scroll
    gsap.to(sectionRef.current, {
      backgroundImage: "linear-gradient(to bottom, #000810, #000c18, #000e1c)",
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="signals"
      className="relative py-24 md:py-32"
      style={{ background: "linear-gradient(to bottom, #000000 0%, #000810 50%, #000c18 100%)" }}
    >
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 space-y-4">
          <SectionLabel text="SIGNALS" />
          <p className="text-slate-500 text-sm tracking-[0.1em]">
            Five live data signals, weighted and scored in real time.
          </p>
        </div>

        <div>
          {SIGNALS.map((signal, idx) => (
            <ScanlineRow
              key={signal.name}
              ref={(el) => { rowRefs.current[idx] = el; }}
              left={
                <div>
                  <p className="text-white font-bold text-sm md:text-base tracking-[0.1em]">
                    {signal.name}
                  </p>
                  <p className="text-slate-500 text-xs md:text-sm mt-1 tracking-[0.05em]">
                    {signal.category}
                  </p>
                </div>
              }
              right={
                <span className="text-cyan-400 text-lg md:text-xl font-bold tracking-[0.1em]">
                  {signal.weight}
                </span>
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
