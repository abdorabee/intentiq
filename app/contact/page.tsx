import type { Metadata } from "next";
import ContactView from "./contact-view";

const CANONICAL = "https://www.vesperwise.com/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to VesperWise. Sales, support, security, press, and partnerships — pick the channel that gets a human to your problem fastest.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "VesperWise",
    url: CANONICAL,
    title: "Contact — VesperWise",
    description:
      "Five channels. The right one is whichever gets a human to your problem fastest.",
  },
};

export default function ContactPage() {
  return <ContactView />;
}
