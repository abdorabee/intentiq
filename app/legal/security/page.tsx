import type { Metadata } from "next";
import SecurityView from "./security-view";

const CANONICAL = "https://www.vesperwise.com/legal/security";

export const metadata: Metadata = {
  title: "Security",
  description:
    "A factual overview of VesperWise identity, application data scoping, API credentials, AI processing, analytics consent, and vulnerability reporting.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "VesperWise",
    url: CANONICAL,
    title: "Security at VesperWise",
    description:
      "Current product security boundaries and how to report a vulnerability.",
  },
};

export default function SecurityPage() {
  return <SecurityView />;
}
