import type { Metadata } from "next";
import ContactView from "./contact-view";

const CANONICAL = "https://www.intentiqs.com/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to IntentIQ. Sales, support, security, press, and partnerships — pick the channel that gets a human to your problem fastest.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "IntentIQ",
    url: CANONICAL,
    title: "Contact — IntentIQ",
    description:
      "Five channels. The right one is whichever gets a human to your problem fastest.",
  },
};

export default function ContactPage() {
  return <ContactView />;
}
