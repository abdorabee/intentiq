"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HUD from "./HUD";
import HeroSection from "./HeroSection";
import SignalsShowcase from "./SignalsShowcase";
import CodeDemo from "./CodeDemo";
import HowItWorks from "./HowItWorks";
import PricingSection from "./PricingSection";
import CTAFooter from "./CTAFooter";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  return (
    <div className="bg-black text-white overflow-x-hidden" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
      <HUD visible={true} />
      <main>
        <HeroSection />
        <SignalsShowcase />
        <CodeDemo />
        <HowItWorks />
        <PricingSection />
        <CTAFooter />
      </main>
    </div>
  );
}
