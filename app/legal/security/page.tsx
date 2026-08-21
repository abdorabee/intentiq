import type { Metadata } from "next";
import SecurityView from "./security-view";

const CANONICAL = "https://www.vesperwise.com/legal/security";

export const metadata: Metadata = {
  title: "Security",
  description:
    "VesperWise security practices: authentication, encryption, data handling, and how we're building toward enterprise readiness.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "VesperWise",
    url: CANONICAL,
    title: "Security at VesperWise",
    description:
      "Early-stage security practices, current controls, and what we're working toward as we scale.",
  },
};

export default function SecurityPage() {
  return <SecurityView />;
}
