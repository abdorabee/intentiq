"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionLabel from "./SectionLabel";
import ScanlineRow from "./ScanlineRow";
import { HOW_IT_WORKS } from "./data";

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(() => {
    if (!sectionRef.current) return;

    rowRefs.current.forEach((row, idx) => {
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

      // Glow pulse on step number
      const numEl = numRefs.current[idx];
      if (numEl) {
        gsap.set(numEl, { textShadow: "0 0 0px rgba(6,182,212,0)" });
        gsap.to(numEl, {
          textShadow: "0 0 20px rgba(6,182,212,0.6)",
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          scrollTrigger: {
            trigger: row,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-24 md:py-32" style={{ background: "linear-gradient(to bottom, #060616 0%, #070718 30%, #070718 70%, #080818 100%)" }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 space-y-4">
          <SectionLabel text="PROCESS" />
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            How it works
          </h2>
          <p className="text-slate-500 text-sm tracking-[0.05em]">
            From domain to deal signal in under 3 seconds.
          </p>
        </div>

        <div>
          {HOW_IT_WORKS.map((item, idx) => (
            <ScanlineRow
              key={item.step}
              ref={(el) => { rowRefs.current[idx] = el; }}
              left={
                <div className="flex items-center gap-4 md:gap-6">
                  <span
                    ref={(el) => { numRefs.current[idx] = el; }}
                    className="text-cyan-400 text-xl md:text-2xl font-bold tracking-[0.1em] flex-shrink-0"
                  >
                    {item.step}
                  </span>
                  <span className="text-white font-bold text-sm md:text-base tracking-[0.05em]">
                    {item.title}
                  </span>
                </div>
              }
              right={
                <p className="text-slate-500 text-xs md:text-sm max-w-xs text-right leading-relaxed hidden md:block">
                  {item.body}
                </p>
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
