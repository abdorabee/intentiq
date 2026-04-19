"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionLabel from "./SectionLabel";
import BracketButton from "./BracketButton";
import { PRICING, COMPARISON } from "./data";

gsap.registerPlugin(ScrollTrigger);

function CompareCheck({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="text-cyan-400 text-xs tracking-[0.2em]">[+]</span>
  ) : (
    <span className="text-slate-700 text-xs tracking-[0.2em]">[—]</span>
  );
}

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardsRef.current) return;

    const cards = cardsRef.current.children;
    gsap.set(cards, { opacity: 0, y: 60, scale: 0.95 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: cardsRef.current,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    if (tableRef.current) {
      gsap.set(tableRef.current, { opacity: 0, y: 30 });
      gsap.to(tableRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: tableRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="pricing" className="py-24 md:py-32" style={{ background: "linear-gradient(to bottom, #000c18 0%, #000810 50%, #000000 100%)" }}>
      <div className="max-w-6xl mx-auto px-6 space-y-16">

        {/* Header */}
        <div className="space-y-4">
          <SectionLabel text="PRICING" />
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Simple pricing
          </h2>
          <p className="text-slate-500 text-sm tracking-[0.05em]">
            100x cheaper than 6sense. Start free, upgrade when you&apos;re ready.
          </p>
        </div>

        {/* Pricing Cards */}
        <div ref={cardsRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PRICING.map((p) => (
            <div
              key={p.plan}
              className={`relative flex flex-col p-5 gap-4 border transition-all ${
                p.highlight
                  ? "border-cyan-500/40 bg-cyan-500/5"
                  : "border-white/[0.08] bg-white/[0.02]"
              }`}
              style={p.highlight ? {
                boxShadow: "0 0 30px rgba(6,182,212,0.15), 0 0 60px rgba(6,182,212,0.05)",
              } : undefined}
            >
              {/* Popular badge */}
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-cyan-500 text-black text-[9px] font-bold px-3 py-0.5 tracking-[0.2em] uppercase">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Plan name + price */}
              <div className="space-y-1">
                <p className="text-slate-400 text-xs tracking-[0.2em]">[ {p.plan.toUpperCase()} ]</p>
                <p className="text-2xl font-bold text-white">
                  {p.price}
                  <span className="text-sm font-normal text-slate-600">/mo</span>
                </p>
                {p.perScore ? (
                  <p className="text-[10px] text-slate-600 tracking-[0.08em]">≈ {p.perScore}/score</p>
                ) : (
                  <p className="text-[10px] text-slate-700 tracking-[0.08em]">no card required</p>
                )}
              </div>

              {/* Credit count */}
              <p className="text-xs text-slate-500 tracking-[0.05em] border-t border-white/[0.06] pt-3">
                {p.credits} credits/month
              </p>

              {/* Features */}
              <ul className="space-y-1.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-cyan-500/70 shrink-0 mt-px">[+]</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto">
                <BracketButton href="/signup" size="sm" className="w-full justify-center">
                  {p.cta}
                </BracketButton>
              </div>
            </div>
          ))}
        </div>

        {/* Risk reversal footer */}
        <p className="text-center text-xs text-slate-600 tracking-[0.1em]">
          No annual contracts &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Pay-as-you-go at $0.08/credit
        </p>

        {/* Competitor Comparison Table */}
        <div ref={tableRef} className="border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  {["PRODUCT", "PRICE", "SMB", "API", "AI", "MENA"].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] tracking-[0.25em] text-slate-600 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {COMPARISON.map((c) => (
                  <tr
                    key={c.name}
                    className={c.you ? "bg-cyan-500/10" : "hover:bg-white/[0.02] transition-colors"}
                  >
                    <td className="px-5 py-4">
                      {c.you ? (
                        <span className="text-cyan-400 font-bold tracking-[0.1em] text-xs">
                          {c.name.toUpperCase()}
                          <span className="ml-2 text-[10px] text-cyan-500/60">[YOU]</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs tracking-[0.05em]">{c.name}</span>
                      )}
                    </td>
                    <td className={`px-5 py-4 text-xs tracking-[0.05em] ${c.you ? "text-cyan-400 font-semibold" : "text-slate-600"}`}>
                      {c.price}
                    </td>
                    <td className="px-5 py-4"><CompareCheck yes={c.smb} /></td>
                    <td className="px-5 py-4"><CompareCheck yes={c.api} /></td>
                    <td className="px-5 py-4"><CompareCheck yes={c.ai} /></td>
                    <td className="px-5 py-4"><CompareCheck yes={c.mena} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
