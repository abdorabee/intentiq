"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_MEASUREMENT_ID = "G-TQKL17V4G9";
export const ANALYTICS_CONSENT_EVENT = "vesperwise-analytics-consent-persisted";

type AnalyticsWindow = typeof window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

function updateAnalyticsConsent(enabled: boolean) {
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.gtag ??= (...args: unknown[]) => { analyticsWindow.dataLayer?.push(args); };
  analyticsWindow.gtag("consent", "update", { analytics_storage: enabled ? "granted" : "denied" });
}

export function GoogleAnalytics({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);

  useEffect(() => {
    if (initialEnabled) updateAnalyticsConsent(true);
    function handleConsent(event: Event) {
      const next = (event as CustomEvent<boolean>).detail;
      if (typeof next !== "boolean") return;
      setEnabled(next);
      updateAnalyticsConsent(next);
    }
    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
  }, [initialEnabled]);

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
          window.gtag = window.gtag || function(){dataLayer.push(arguments);};
          gtag('consent', 'default', { analytics_storage: 'granted' });
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
