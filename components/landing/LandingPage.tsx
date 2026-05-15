import LandingBanner from "./LandingBanner";
import HUD from "./HUD";
import HeroSection from "./HeroSection";
import LogoStrip from "./LogoStrip";
import PillarsSection from "./PillarsSection";
import StatsSection from "./StatsSection";
import ScoreFeatureSection from "./ScoreFeatureSection";
import PipelineFeatureSection from "./PipelineFeatureSection";
import AutopilotFeatureSection from "./AutopilotFeatureSection";
import DevelopersSection from "./DevelopersSection";
import TestimonialsSection from "./TestimonialsSection";
import SignalsShowcase from "./SignalsShowcase";
import CodeDemo from "./CodeDemo";
import HowItWorks from "./HowItWorks";
import PricingV2Section from "./PricingV2Section";
import FinalCtaSection from "./FinalCtaSection";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#08090a] font-sans text-[#f7f8f8] antialiased">
      <LandingBanner />
      <HUD visible={true} />
      <main>
        <HeroSection />
        <LogoStrip />
        <PillarsSection />
        <StatsSection />
        <ScoreFeatureSection />
        <PipelineFeatureSection />
        <AutopilotFeatureSection />
        <DevelopersSection />
        <TestimonialsSection />
        <SignalsShowcase />
        <CodeDemo />
        <HowItWorks />
        <PricingV2Section />
        <FinalCtaSection />
        <LandingFooter />
      </main>
    </div>
  );
}
