"use client";

import { useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Loader from "./Loader";
import HUD from "./HUD";
import HeroSection from "./HeroSection";
import SignalsShowcase from "./SignalsShowcase";
import CodeDemo from "./CodeDemo";
import HowItWorks from "./HowItWorks";
import PricingSection from "./PricingSection";
import CTAFooter from "./CTAFooter";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const [hasEntered, setHasEntered] = useState(false);

  const handleEnter = () => {
    setHasEntered(true);
    // Refresh ScrollTrigger after content renders
    setTimeout(() => ScrollTrigger.refresh(), 100);
  };

  return (
    <div className="bg-black text-white overflow-x-hidden" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
      {/* Loader */}
      {!hasEntered && <Loader onEnter={handleEnter} />}

      {/* Main content */}
      {hasEntered && (
        <>
          <HUD visible={hasEntered} />
          <main>
            <HeroSection />
            <SignalsShowcase />
            <CodeDemo />
            <HowItWorks />
            <PricingSection />
            <CTAFooter />
          </main>
        </>
      )}
    </div>
  );
}
