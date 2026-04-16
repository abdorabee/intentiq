import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "IntentIQ — B2B Intent Scoring for MENA",
    template: "%s | IntentIQ",
  },
  description:
    "Score any company 0–100 for purchase intent in one API call. Funding, hiring, news, tech stack & web signals combined with AI reasoning — 100x cheaper than 6sense or Bombora. Built for MENA sales teams.",
  metadataBase: new URL("https://www.intentiqs.com"),
  keywords: [
    "B2B intent data",
    "buyer intent signals",
    "lead scoring",
    "sales intelligence",
    "MENA",
    "intent scoring API",
    "6sense alternative",
    "Bombora alternative",
    "purchase intent",
    "B2B sales",
    "SMB sales tools",
    "intent data platform",
  ],
  authors: [{ name: "IntentIQ", url: "https://www.intentiqs.com" }],
  creator: "IntentIQ",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.intentiqs.com",
    siteName: "IntentIQ",
    title: "IntentIQ — B2B Buyer Intent Signals for SMB Sales Teams",
    description:
      "Track hiring spikes, funding rounds, tech stack changes, and news mentions. " +
      "Surface companies ready to buy before your competitors do. From $49/mo.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "IntentIQ — B2B Buyer Intent Signals for SMB Sales Teams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentIQ — B2B Buyer Intent Signals",
    description:
      "Track hiring spikes, funding rounds, tech stack changes and more. Find your buyers first.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased`}>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
