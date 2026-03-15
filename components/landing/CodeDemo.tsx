"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionLabel from "./SectionLabel";
import { CODE_EXAMPLES } from "./data";

gsap.registerPlugin(ScrollTrigger);

type Tab = "curl" | "javascript" | "python";

export default function CodeDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("curl");

  useGSAP(() => {
    if (!terminalRef.current) return;

    gsap.set(terminalRef.current, { opacity: 0, y: 40, scale: 0.98 });
    gsap.to(terminalRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: terminalRef.current,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  }, { scope: sectionRef });

  // Animate code lines on tab change
  useGSAP(() => {
    if (!codeRef.current) return;
    const lines = codeRef.current.querySelectorAll(".code-line");
    gsap.set(lines, { opacity: 0, x: -10 });
    gsap.to(lines, { opacity: 1, x: 0, stagger: 0.05, duration: 0.3, ease: "power2.out" });
  }, { dependencies: [activeTab], scope: codeRef });

  const tabs: { key: Tab; label: string }[] = [
    { key: "curl", label: "curl" },
    { key: "javascript", label: "JavaScript" },
    { key: "python", label: "Python" },
  ];

  const codeLines = CODE_EXAMPLES[activeTab].split("\n");

  return (
    <section ref={sectionRef} id="api" className="py-24 md:py-32" style={{ background: "linear-gradient(to bottom, #000c18 0%, #000e1c 50%, #000c18 100%)" }}>
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        <div className="space-y-4">
          <SectionLabel text="API" />
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            One API call.
          </h2>
          <p className="text-slate-500 text-sm tracking-[0.05em]">
            Works with curl, JavaScript, Python — or any HTTP client.
          </p>
        </div>

        <div ref={terminalRef} className="border border-cyan-500/20 overflow-hidden">
          {/* Terminal title bar */}
          <div className="flex items-center justify-between bg-cyan-500/5 px-4 py-3 border-b border-cyan-500/15">
            <span className="text-cyan-500/60 text-xs tracking-[0.2em]">[ intentiq / terminal ]</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500/30" />
              <span className="h-2 w-2 rounded-full bg-cyan-500/30" />
              <span className="h-2 w-2 rounded-full bg-cyan-500/50" />
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-cyan-500/10 bg-black/50 overflow-x-auto flex-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 text-xs tracking-[0.15em] uppercase transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? "text-cyan-400 border-b border-cyan-400 bg-cyan-500/5"
                    : "text-slate-600 hover:text-slate-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Code content with scanline overlay */}
          <div className="relative">
            <div className="scanline-overlay absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.02) 2px, rgba(6,182,212,0.02) 4px)",
              }}
            />
            <pre ref={codeRef} className="p-6 text-sm leading-relaxed overflow-x-auto">
              {codeLines.map((line, i) => (
                <div key={`${activeTab}-${i}`} className="code-line">
                  <span className="text-cyan-500/30 mr-4 select-none text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-emerald-400">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
