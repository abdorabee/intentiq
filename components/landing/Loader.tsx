"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import BracketButton from "./BracketButton";

interface LoaderProps {
  onEnter: () => void;
}

export default function Loader({ onEnter }: LoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"counting" | "intro" | "ready">("counting");

  // Counter: 0 -> 100 over 3 seconds using direct DOM manipulation (no re-renders)
  useEffect(() => {
    const start = performance.now();
    const duration = 3000;
    let raf: number;

    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      if (counterRef.current) {
        counterRef.current.textContent = String(Math.round(eased * 100));
      }

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase("intro");
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Animate intro text and enter button when phase changes
  useEffect(() => {
    if (phase !== "intro") return;

    const children = introRef.current ? Array.from(introRef.current.children) as HTMLElement[] : [];
    const enterEl = enterRef.current;
    const timers: ReturnType<typeof setTimeout>[] = [];

    children.forEach((el, i) => {
      timers.push(setTimeout(() => {
        el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, i * 400));
    });

    timers.push(setTimeout(() => {
      if (enterEl) {
        enterEl.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
        enterEl.style.opacity = "1";
        enterEl.style.transform = "translateY(0)";
      }
      setPhase("ready");
    }, children.length * 400 + 600));

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const handleEnter = useCallback(() => {
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: onEnter,
    });
  }, [onEnter]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
    >
      {/* Blurred background image */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(20px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-xl w-full px-8">
        {/* Loading indicator */}
        <div className="space-y-1 mb-12">
          <p className="text-cyan-500/60 text-xs tracking-[0.3em]">[[</p>
          <p className="text-cyan-400 text-sm tracking-[0.2em] ml-4">[loading]</p>
          <p className="text-cyan-500/60 text-xs tracking-[0.3em] ml-8">]]]</p>
          <p className="text-white text-sm tracking-[0.15em] ml-12 counter-glow">
            [<span ref={counterRef}>0</span>%]
          </p>
          <p className="text-cyan-500/60 text-xs tracking-[0.3em]">[[[][]</p>
        </div>

        {/* Intro text — initial styles set via inline so they don't get reset by re-renders */}
        <div ref={introRef} className="space-y-4 mb-10">
          <p className="text-slate-300/80 text-sm md:text-base leading-relaxed" style={{ opacity: 0, transform: "translateY(20px)" }}>
            Intent data changes everything.
            <br />
            Know who is ready to buy before
            <br />
            your competitors do.
          </p>
          <p className="text-slate-200 text-sm md:text-base" style={{ opacity: 0, transform: "translateY(20px)" }}>
            {`I'm IntentIQ.`}
          </p>
          <p className="text-white text-base md:text-lg font-medium" style={{ opacity: 0, transform: "translateY(20px)" }}>
            They call it Sales Intelligence.
          </p>
        </div>

        {/* Enter button */}
        <div ref={enterRef} style={{ opacity: 0, transform: "translateY(10px)" }}>
          <BracketButton onClick={handleEnter} size="md">
            Enter
          </BracketButton>
        </div>
      </div>
    </div>
  );
}
