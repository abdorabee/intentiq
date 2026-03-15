"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import SectionLabel from "./SectionLabel";
import BracketButton from "./BracketButton";

gsap.registerPlugin(ScrollTrigger);

export default function CTAFooter() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!contentRef.current) return;

    gsap.set(contentRef.current.children, { opacity: 0, y: 30 });
    gsap.to(contentRef.current.children, {
      opacity: 1,
      y: 0,
      stagger: 0.15,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: {
        trigger: contentRef.current,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    // Slow grid scroll
    if (gridRef.current) {
      gsap.to(gridRef.current, {
        backgroundPositionY: "-100px",
        duration: 20,
        repeat: -1,
        ease: "none",
      });
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative">
      {/* Wireframe grid background */}
      <div
        ref={gridRef}
        className="wireframe-grid absolute inset-0"
      />
      {/* Radial fade overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

      {/* CTA Content */}
      <div className="relative z-10 py-32 md:py-40">
        <div ref={contentRef} className="max-w-2xl mx-auto px-6 text-center space-y-8">
          <SectionLabel text="START" />

          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Ready to score
            <br />
            your pipeline?
          </h2>

          <p className="text-slate-500 text-sm tracking-[0.05em] max-w-md mx-auto leading-relaxed">
            Start with 20 free credits. No credit card required. Score any company in under 3 seconds.
          </p>

          <div className="pt-4">
            <BracketButton href="/signup" size="lg">
              Start Scoring
            </BracketButton>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-cyan-400 text-xs tracking-[0.2em]">INTENTIQ</span>
          <p className="text-[10px] text-slate-600 tracking-[0.15em]">
            © {new Date().getFullYear()} INTENTIQ · BUILT FOR B2B SALES TEAMS
          </p>
          <div className="flex gap-6 text-[10px] text-slate-600 tracking-[0.15em]">
            <Link href="/login" className="hover:text-slate-300 transition-colors">SIGN IN</Link>
            <Link href="/signup" className="hover:text-slate-300 transition-colors">SIGN UP</Link>
            <Link href="/docs" className="hover:text-slate-300 transition-colors">DOCS</Link>
          </div>
        </div>
      </footer>
    </section>
  );
}
