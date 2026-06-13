import type { Metadata } from "next";
import AboutView from "./about-view";

const CANONICAL = "https://www.vesperwise.com/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "VesperWise is built by one person — Abdel‑Rahaman Rabee — from a single room. The story, the principles, and the stack behind the product.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "VesperWise",
    url: CANONICAL,
    title: "About — VesperWise",
    description:
      "One founder, one room, zero outside funding. Here's how VesperWise gets built.",
  },
};

export default function AboutPage() {
  return <AboutView />;
}
