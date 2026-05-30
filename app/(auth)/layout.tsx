"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const FACTS = [
  {
    stat: "2.4M",
    label: "accounts scored to date",
    sub: "Across fintech, SaaS, and enterprise sales teams.",
  },
  {
    stat: "<3s",
    label: "median time to first score",
    sub: "Five signals, one number, in under three seconds.",
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
    text: "We replaced our 6sense seat with IntentIQ for a tenth of the cost. AE adoption was the surprise.",
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
      style={{
        flex: "0 0 44%",
        background: "#0d0f11",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "40px 44px",
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
          top: "-100px",
          left: "-100px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "rgba(94,106,210,0.14)",
          filter: "blur(260px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(74,222,128,0.07)",
          filter: "blur(220px)",
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
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "7px",
            background: "linear-gradient(135deg, #5e6ad2, #7170ff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: "13px",
            letterSpacing: "-0.02em",
          }}
        >
          IQ
        </div>
        <span
          style={{
            color: "#f7f8f8",
            fontWeight: 600,
            fontSize: "16px",
            letterSpacing: "-0.02em",
          }}
        >
          IntentIQ
        </span>
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
            fontSize: "64px",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            background: "linear-gradient(135deg, #f7f8f8 60%, #8a8f98)",
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
            fontWeight: 600,
            color: "#f7f8f8",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
          }}
        >
          {fact.label}
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#8a8f98",
            lineHeight: 1.5,
            maxWidth: "280px",
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
                background: i === factIdx ? "#5e6ad2" : "rgba(255,255,255,0.15)",
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
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: "#b4bbc8",
            lineHeight: 1.65,
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
              borderRadius: "50%",
              background: "linear-gradient(135deg, #5e6ad2, #4ec9d8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
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
      style={{
        minHeight: "100vh",
        background: "#08090a",
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
        }}
      >
        {children}
      </div>
    </div>
  );
}
