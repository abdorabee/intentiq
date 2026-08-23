"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_MEASUREMENT_ID = "G-TQKL17V4G9";
export const ANALYTICS_CONSENT_EVENT = "vesperwise-analytics-consent-persisted";

export function GoogleAnalytics({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);

  useEffect(() => {
    function handleConsent(event: Event) {
      const next = (event as CustomEvent<boolean>).detail;
      setEnabled(next);
      if (!next) {
        const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;
        gtag?.("consent", "update", { analytics_storage: "denied" });
      }
    }
    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
