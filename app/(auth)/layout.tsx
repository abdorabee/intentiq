import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #08090a)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
      }}
    >
      {/* Subtle glow blobs matching hero section */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-200px",
            left: "-100px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "rgba(94,106,210,0.12)",
            filter: "blur(120px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-80px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(113,112,255,0.08)",
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "32px",
          textDecoration: "none",
          color: "var(--text-primary, #f7f8f8)",
          fontWeight: 600,
          fontSize: "15px",
          letterSpacing: "-0.022em",
        }}
      >
        <span
          style={{
            width: "26px",
            height: "26px",
            display: "grid",
            placeItems: "center",
            borderRadius: "6px",
            background: "linear-gradient(140deg, #4ec9d8 0%, #5e6ad2 70%, #7170ff 100%)",
            color: "#0a0b0f",
            fontWeight: 800,
            fontSize: "11px",
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            boxShadow: "0 2px 8px rgba(94,106,210,0.4)",
            flexShrink: 0,
          }}
        >
          IQ
        </span>
        <span>IntentIQ</span>
      </Link>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--surface, #131517)",
          border: "1px solid var(--border-strong, rgba(255,255,255,0.13))",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px -12px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
