"use client";

import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionLabel from "./SectionLabel";
import BracketButton from "./BracketButton";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paraRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const targets = [labelRef.current, headingRef.current, paraRef.current, ctaRef.current];
    gsap.set(targets, { opacity: 0, y: 30 });

    const tl = gsap.timeline({ delay: 0.2 });

    tl.to(labelRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
    tl.to(headingRef.current, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.3");
    tl.to(paraRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4");
    tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.3");

    // Parallax on video
    if (videoRef.current) {
      gsap.to(videoRef.current, {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Video background */}
      {!isMobile && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          aria-hidden="true"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl text-center space-y-8">
        <div ref={labelRef}>
          <SectionLabel text="INTENT IQ" />
        </div>

        <h1
          ref={headingRef}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
        >
          Score Every Company
          <br />
          for{" "}
          <span className="text-glow-cyan text-cyan-400">Buying Intent</span>
        </h1>

        <p
          ref={paraRef}
          className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed"
        >
          One API call. Any company. A composite intent score (0–100) with AI reasoning
          and a specific action — in under 3 seconds. No setup. No contract. From $49/mo.
        </p>

        <div ref={ctaRef} className="flex flex-wrap gap-4 justify-center">
          <BracketButton href="/signup" size="lg">
            Start Free
          </BracketButton>
          <BracketButton href="#signals" size="md">
            Discover
          </BracketButton>
        </div>

        <p className="text-slate-600 text-xs tracking-[0.1em]">
          6sense charges $50,000+/year for the same output. You pay $49/month.
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-px h-12 bg-gradient-to-b from-cyan-500/50 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
