import type { Metadata } from "next";
import SubprocessorsView from "./subprocessors-view";

const CANONICAL = "https://www.vesperwise.com/legal/subprocessors";

export const metadata: Metadata = {
  title: "Subprocessors",
  description:
    "Third-party service providers VesperWise uses to operate the Service, and the security standards they meet.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "VesperWise",
    url: CANONICAL,
    title: "Subprocessors — VesperWise",
    description:
      "SOC 2 Type II-certified providers for auth, hosting, billing, and AI processing.",
  },
};

export default function SubprocessorsPage() {
  return <SubprocessorsView />;
}
