"use client";

import { useState } from "react";
import SectionLabel from "./SectionLabel";
import { CODE_EXAMPLES } from "./data";

type Tab = "curl" | "javascript" | "python";

export default function CodeDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("curl");

  const tabs: { key: Tab; label: string }[] = [
    { key: "curl", label: "curl" },
    { key: "javascript", label: "JavaScript" },
    { key: "python", label: "Python" },
  ];

  const codeLines = CODE_EXAMPLES[activeTab].split("\n");

  return (
    <section id="developers" className="border-b border-white/[0.06] bg-[#08090a] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <SectionLabel text="API" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#f7f8f8] md:text-3xl">One API call.</h2>
          <p className="mt-2 text-sm text-[#8a8f98]">Works with curl, JavaScript, Python — or any HTTP client.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#dfff00]/25">
          <div className="flex items-center justify-between border-b border-[#dfff00]/15 bg-[#dfff00]/8 px-4 py-3">
            <span className="font-mono text-xs tracking-widest text-[#e8ff40]/70">vesperwise / terminal</span>
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#dfff00]/35" />
              <span className="h-2 w-2 rounded-full bg-[#dfff00]/35" />
              <span className="h-2 w-2 rounded-full bg-[#dfff00]/80" />
            </div>
          </div>
          <div className="flex overflow-x-auto border-b border-white/[0.06] bg-black/50">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`cursor-pointer px-5 py-2.5 text-xs uppercase tracking-widest transition-colors ${
                  activeTab === tab.key
                    ? "border-b border-[#e8ff40] bg-[#dfff00]/8 text-[#dfff00]"
                    : "text-[#62666d] hover:text-[#8a8f98]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
            {codeLines.map((line, i) => (
              <div key={`${activeTab}-${i}`}>
                <span className="mr-4 select-none text-xs text-[#e8ff40]/35">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-emerald-400">{line}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </section>
  );
}
