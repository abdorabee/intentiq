import type { Metadata } from "next";
import PrivacyView from "./privacy-view";

const CANONICAL = "https://www.intentiqs.com/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How IntentIQ Labs collects, uses, and protects your data. Plain English, GDPR-mapped.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "IntentIQ",
    url: CANONICAL,
    title: "Privacy Policy — IntentIQ",
    description:
      "How we handle your data. Written in plain English and mapped to GDPR clauses.",
  },
};

export default function PrivacyPage() {
  return <PrivacyView />;
}
