"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import IntentIQLogo from "@/components/intentiq-logo";

const FACTS = [
  {
    stat: "2.4M",
    label: "accounts scored to date",
    sub: "Across fintech, SaaS, and enterprise sales teams.",
  },
  {
    stat: "6h",
    label: "median time to first score",
    sub: "Four intent triggers with a personalized result cache.",
  },
  {
    stat: "+38%",
    label: "lift in HOT-band reply rate",
    sub: "Teams that score first, book first.",
  },
  {
    stat: "99.97%",
    label: "API uptime, last 90 days",
    sub: "Built for sales ops that can't afford downtime.",
  },
];

const QUOTES = [
  {
    text: "We replaced our 6sense seat with VesperWise for a tenth of the cost. AE adoption was the surprise.",
    name: "Sana Kapoor",
    role: "VP Sales · Roundwave",
    av: "SK",
  },
  {
    text: "Autopilot caught a Series B and routed the account to my closer at 4:42 AM. Meeting booked by 9.",
    name: "Marcus Ng",
    role: "Head of GTM · Northbeam",
    av: "MN",
  },
  {
    text: "The 0–100 score is the only signal we put in our Mondays. Reps trust it because the reasoning shows up next to the number.",
    name: "Rhea Doshi",
    role: "Sales Ops Lead · Halcyon",
    av: "RD",
  },
];

function LeftPanel() {
  const [factIdx, setFactIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setFactIdx((i) => (i + 1) % FACTS.length);
        setQuoteIdx((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const fact = FACTS[factIdx];
  const quote = QUOTES[quoteIdx];

  return (
    <div
      className="auth-left-panel"
      style={{
        flex: "0 0 44%",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018)), #0d0f11",
        borderRight: "1px solid rgba(255,255,255,0.09)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "44px",
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
      }}
    >
      {/* Glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-160px",
          left: "-180px",
          width: "620px",
          height: "620px",
          borderRadius: "50%",
          background: "rgba(223,255,0,0.12)",
          filter: "blur(280px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-160px",
          right: "-140px",
          width: "520px",
          height: "520px",
          borderRadius: "50%",
          background: "rgba(74,222,128,0.08)",
          filter: "blur(260px)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        <IntentIQLogo size={48} variant="wordmark" />
      </Link>

      {/* Middle — rotating stat */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          transition: "opacity 0.4s ease",
          opacity: visible ? 1 : 0,
        }}
      >
        <div
          style={{
            fontSize: "clamp(56px, 7vw, 84px)",
            fontWeight: 720,
            letterSpacing: "0",
            lineHeight: 1,
            background: "linear-gradient(135deg, #ffffff 45%, #b8bec8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "14px",
          }}
        >
          {fact.stat}
        </div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 650,
            color: "#f7f8f8",
            letterSpacing: "0",
            marginBottom: "8px",
          }}
        >
          {fact.label}
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#a8afb9",
            lineHeight: 1.6,
            maxWidth: "320px",
          }}
        >
          {fact.sub}
        </div>

        {/* Dot indicators */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginTop: "24px",
          }}
        >
          {FACTS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === factIdx ? "20px" : "6px",
                height: "6px",
                borderRadius: "999px",
                background: i === factIdx ? "#dfff00" : "rgba(255,255,255,0.15)",
                transition: "all 0.4s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom — rotating quote */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          transition: "opacity 0.4s ease",
          opacity: visible ? 1 : 0,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "28px",
          maxWidth: "420px",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: "#c8ced8",
            lineHeight: 1.7,
            marginBottom: "16px",
            fontStyle: "italic",
          }}
        >
          &ldquo;{quote.text}&rdquo;
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "999px",
              background: "linear-gradient(180deg, #ecff58, #dfff00)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#050505",
              fontSize: "10px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {quote.av}
          </div>
          <div>
            <div
              style={{ fontSize: "12px", fontWeight: 600, color: "#f7f8f8" }}
            >
              {quote.name}
            </div>
            <div style={{ fontSize: "11px", color: "#62666d" }}>
              {quote.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="auth-shell"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 12% -12%, rgba(223,255,0,0.12), transparent 36rem), radial-gradient(circle at 92% 10%, rgba(74,222,128,0.07), transparent 30rem), #08090a",
        display: "flex",
        fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
      }}
    >
      {/* Left panel — hidden on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
          .auth-right { padding: 32px 20px !important; }
        }
        .auth-right > * {
          position: relative;
          z-index: 1;
        }
      `}</style>
      <div className="auth-left" style={{ display: "flex", flex: "0 0 44%" }}>
        <LeftPanel />
      </div>

      {/* Right panel — form */}
      <div
        className="auth-right"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "auto 12% 10% auto",
            width: "360px",
            height: "360px",
            borderRadius: "999px",
            background: "rgba(223,255,0,0.055)",
            filter: "blur(150px)",
            pointerEvents: "none",
          }}
        />
        {children}
      </div>
    </div>
  );
}
