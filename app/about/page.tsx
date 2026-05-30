import type { Metadata } from "next";
import AboutView from "./about-view";

const CANONICAL = "https://www.intentiqs.com/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "IntentIQ is built by one person — Abdel‑Rahaman Rabee — from a single room. The story, the principles, and the stack behind the product.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "IntentIQ",
    url: CANONICAL,
    title: "About — IntentIQ",
    description:
      "One founder, one room, zero outside funding. Here's how IntentIQ gets built.",
  },
};

export default function AboutPage() {
  return <AboutView />;
}
