"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";

interface HUDProps {
  visible: boolean;
}

export default function HUD({ visible }: HUDProps) {
  const hudRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!visible || !hudRef.current) return;

    const elements = hudRef.current.querySelectorAll("[data-hud]");
    gsap.set(elements, { opacity: 0 });
    gsap.to(elements, { opacity: 1, stagger: 0.15, duration: 0.6, ease: "power2.out", delay: 0.3 });
  }, { dependencies: [visible], scope: hudRef });

  if (!visible) return null;

  return (
    <div ref={hudRef} className="fixed inset-0 z-40 pointer-events-none">
      {/* Top-left: Logo + version */}
      <div data-hud className="absolute top-5 left-6">
        <p className="text-white text-xs tracking-[0.15em] leading-tight font-medium pointer-events-auto">
          INTENT
          <br />
          IQ
        </p>
        <p className="text-slate-500 text-[10px] tracking-[0.2em] mt-1">1.0</p>
      </div>

      {/* Top-right: Menu */}
      <div data-hud className="absolute top-5 right-6">
        <nav className="flex items-center gap-6 pointer-events-auto">
          <Link href="#signals" className="text-slate-400 text-xs tracking-[0.2em] hover:text-white transition-colors">
            SIGNALS
          </Link>
          <Link href="#api" className="text-slate-400 text-xs tracking-[0.2em] hover:text-white transition-colors hidden md:inline">
            API
          </Link>
          <Link href="#pricing" className="text-slate-400 text-xs tracking-[0.2em] hover:text-white transition-colors hidden md:inline">
            PRICING
          </Link>
          <Link href="/login" className="text-slate-400 text-xs tracking-[0.2em] hover:text-white transition-colors">
            SIGN IN
          </Link>
          <Link href="/signup" className="text-cyan-400 text-xs tracking-[0.2em] hover:text-cyan-300 transition-colors">
            START FREE
          </Link>
        </nav>
      </div>

      {/* Bottom-right: Contact info */}
      <div data-hud className="absolute bottom-5 right-6 text-right hidden md:block">
        <p className="text-slate-500 text-[10px] tracking-[0.15em]">hello@intentiq.com</p>
        <p className="text-slate-600 text-[10px] tracking-[0.15em]">API v1 · Live</p>
      </div>
    </div>
  );
}
