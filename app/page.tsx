import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

const CANONICAL = "https://www.vesperwise.com";

export const metadata: Metadata = {
  title: "VesperWise — B2B Buyer Intent Signals for SMB Sales Teams",
  description:
    "VesperWise tracks hiring spikes, funding rounds, tech stack changes, news mentions, " +
    "and web activity to surface companies ready to buy — before your competitors know. " +
    "Affordable intent data from $49/mo. 100x cheaper than 6sense or Bombora.",
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "VesperWise",
    url: CANONICAL,
    title: "VesperWise — B2B Buyer Intent Signals for SMB Sales Teams",
    description:
      "Know which companies are ready to buy before your competitors do. " +
      "Intent data for SMB sales teams at a fraction of enterprise pricing.",
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${CANONICAL}/#software`,
      name: "VesperWise",
      url: CANONICAL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "B2B buyer intent signal platform tracking hiring spikes, funding rounds, " +
        "tech stack changes, news mentions, and web activity for SMB sales teams.",
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        description: "Free tier available. Paid plans from $49/mo.",
      },
    },
    {
      "@type": "Organization",
      "@id": `${CANONICAL}/#organization`,
      name: "VesperWise",
      url: CANONICAL,
      description:
        "First affordable B2B intent data platform for MENA. 100x cheaper than 6sense, Bombora, and ZoomInfo.",
      logo: {
        "@type": "ImageObject",
        url: `${CANONICAL}/icon.svg`,
      },
      sameAs: ["https://www.linkedin.com/company/vesperwise"],
    },
    {
      "@type": "WebSite",
      "@id": `${CANONICAL}/#website`,
      url: CANONICAL,
      name: "VesperWise",
      publisher: { "@id": `${CANONICAL}/#organization` },
    },
  ],
};

// Root "/" — dashboard if logged in, marketing landing page if not
export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/*
       * SEO content layer — off-screen for human visitors, fully readable by Googlebot.
       * Uses position:absolute left:-9999px (NOT display:none / visibility:hidden) so the
       * content is genuinely present in the server-rendered DOM without being a visible
       * overlay. The gateway animation renders on top as normal.
       */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <h1>B2B Buyer Intent Signals for SMB Sales Teams</h1>
        <p>
          VesperWise tracks buying signals across thousands of companies so your
          sales team knows who is ready to buy before your competitors do.
          Affordable intent data for small and mid-size B2B teams. From $49/mo.
        </p>

        <h2>Hiring Spikes</h2>
        <p>
          Detect when a company is rapidly expanding a specific team — a strong
          signal they are investing in a new initiative and actively buying tools.
          VesperWise scores hiring velocity as 20% of the composite intent score.
        </p>

        <h2>Funding Rounds</h2>
        <p>
          Track when companies close Series A, B, or seed rounds. Freshly funded
          companies have budget and are actively evaluating new software.
          Funding signals carry 25% of the total intent score.
        </p>

        <h2>News Mentions</h2>
        <p>
          Monitor press coverage and announcements that signal strategic shifts,
          new leadership, or expansion — all buying triggers. News signals
          contribute 20% of the composite intent score.
        </p>

        <h2>Tech Stack Changes</h2>
        <p>
          Identify when companies adopt or drop tools in your category. Stack
          changes reveal evaluation cycles you can enter at exactly the right
          moment. Technology signals account for 20% of the intent score.
        </p>

        <h2>Web Activity</h2>
        <p>
          Surface companies researching topics relevant to your product right now,
          based on content consumption and web presence signals. Web signals
          contribute 15% of the composite intent score.
        </p>

        <h2>Why VesperWise</h2>
        <p>
          Enterprise intent platforms like 6sense and Bombora cost tens of
          thousands per year and require months of onboarding. VesperWise gives
          SMB sales and marketing teams the same buying signals at a fraction of
          the cost — starting free, scaling to $499/mo — with no setup complexity
          and a single API call per company.
        </p>

        <h2>Intent Scoring API</h2>
        <p>
          One REST API call returns a composite intent score (0–100), a score
          band (HOT / WARM / COLD), an AI-generated summary, a why-now insight,
          and a specific recommended outreach action. Results in under 3 seconds.
          No CRM integration required.
        </p>
      </div>

      {/* Gateway animation — the full visual experience for real visitors */}
      <LandingPage />
    </>
  );
}
