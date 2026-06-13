import type { Metadata } from "next";
import TermsView from "./terms-view";

const CANONICAL = "https://www.vesperwise.com/terms";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The contract between VesperWise Labs, Inc. and the company or individual using our products. " +
    "Written by a real lawyer; edited so a human can read it.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "VesperWise",
    url: CANONICAL,
    title: "Terms of Service — VesperWise",
    description:
      "Use VesperWise for B2B sales work. Your data stays yours. Either side can leave with 30 days notice.",
  },
};

export default function TermsPage() {
  return <TermsView />;
}
