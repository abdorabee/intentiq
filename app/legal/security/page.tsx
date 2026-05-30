import type { Metadata } from "next";
import SecurityView from "./security-view";

const CANONICAL = "https://www.intentiqs.com/legal/security";

export const metadata: Metadata = {
  title: "Security",
  description:
    "IntentIQ security: SOC 2 Type II, GDPR/DPA, encryption, architecture diagram, all 12 controls, and how to report a vulnerability.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "IntentIQ",
    url: CANONICAL,
    title: "Security at IntentIQ",
    description:
      "Certifications, architecture, controls, and the email address you use to tell us when something looks wrong.",
  },
};

export default function SecurityPage() {
  return <SecurityView />;
}
