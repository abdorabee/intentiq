import type { Metadata } from "next";
import DpaView from "./dpa-view";

const CANONICAL = "https://www.vesperwise.com/legal/dpa";

export const metadata: Metadata = {
  title: "Data Processing Agreement",
  description:
    "The GDPR Article 28 controller-to-processor agreement governing how VesperWise handles personal data on your behalf. Automatically incorporated into our Terms of Service.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "VesperWise",
    url: CANONICAL,
    title: "Data Processing Agreement — VesperWise",
    description:
      "GDPR Art. 28 DPA with Standard Contractual Clauses (EU 2021/914) and UK Addendum.",
  },
};

export default function DpaPage() {
  return <DpaView />;
}
