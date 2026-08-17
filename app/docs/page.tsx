import type { Metadata } from "next";
import DocsView from "./docs-view";

const CANONICAL = "https://www.vesperwise.com/docs";

export const metadata: Metadata = {
  title: "API Reference",
  description:
    "VesperWise API v1 — coverage-aware company intent scoring. Authentication, endpoints, caching, and response reference.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    siteName: "VesperWise",
    url: CANONICAL,
    title: "API Reference — VesperWise",
    description:
      "One endpoint. Any company. Explicit coverage. REST API reference with curl and Node examples.",
  },
};

export default function DocsPage() {
  return <DocsView />;
}
