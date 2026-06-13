import type { Metadata } from "next";
import DocsView from "./docs-view";

const CANONICAL = "https://www.vesperwise.com/docs";

export const metadata: Metadata = {
  title: "API Reference",
  description:
    "VesperWise API v1 — score any company in under 3 seconds. Authentication, endpoints, webhooks, SDKs, and full parameter reference.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "VesperWise",
    url: CANONICAL,
    title: "API Reference — VesperWise",
    description:
      "One endpoint. Any company. 3 seconds. Full REST API reference with code samples in curl, Node, and Python.",
  },
};

export default function DocsPage() {
  return <DocsView />;
}
