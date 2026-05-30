"use client";

import Link from "next/link";

/* ── Design tokens ───────────────────────────────────────────── */
const T = {
  bg:            "#08090a",
  bgEl:          "#0e1011",
  surface:       "#131517",
  txtPrimary:    "#f7f8f8",
  txtSecondary:  "#b4bbc8",
  txtTertiary:   "#8a8f98",
  txtQuaternary: "#62666d",
  border:        "rgba(255,255,255,0.08)",
  borderStrong:  "rgba(255,255,255,0.13)",
  borderSubtle:  "rgba(255,255,255,0.05)",
  accent:        "#5e6ad2",
  accent2:       "#7170ff",
  cyan:          "#4ec9d8",
  cyanSoft:      "rgba(78,201,216,0.16)",
  hot:           "#4ade80",
  warm:          "#f5b544",
  fontSans:      "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontMono:      "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

const NAV_LINKS = [
  { label: "Product",    href: "/#product"   },
  { label: "Autopilot",  href: "/#autopilot" },
  { label: "Developers", href: "/docs"       },
  { label: "Pricing",    href: "/#pricing"   },
  { label: "Customers",  href: "/#"          },
  { label: "Company",    href: "/#"          },
];

/* ── Helper ──────────────────────────────────────────────────── */
function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: T.txtPrimary, fontWeight: 500 }}>{children}</strong>;
}
function Code({ children }: { children: React.ReactNode }) {
  return <code style={{ fontFamily: T.fontMono, fontSize: "12px", padding: "1px 5px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", color: T.txtPrimary }}>{children}</code>;
}

/* ── Certifications ──────────────────────────────────────────── */
const CERTS = [
  { badge: "SOC2", grad: "linear-gradient(135deg,#4ec9d8,#5e6ad2)", name: "SOC 2 Type II",  meta: "AICPA · annual",         status: "Audited Feb '26", pending: false },
  { badge: "GDPR", grad: "linear-gradient(135deg,#4ade80,#22c55e)", name: "GDPR · DPA",      meta: "EU 2016/679 · SCCs",    status: "Live · v1.6",     pending: false },
  { badge: "CCPA", grad: "linear-gradient(135deg,#f5b544,#ec4899)", name: "CCPA / CPRA",     meta: "California · 1798.100", status: "Live",            pending: false },
  { badge: "ISO",  grad: "linear-gradient(135deg,#7170ff,#c9c4ff)", name: "ISO 27001",       meta: "Stage 1 in progress",   status: "Audit Q4 '26",    pending: true  },
  { badge: "HIPAA",grad: "linear-gradient(135deg,#ec4899,#f87171)", name: "HIPAA",           meta: "Not in scope",          status: "Out of scope",    pending: true  },
];

/* ── Security pillars ────────────────────────────────────────── */
const PILLARS = [
  {
    type: "people",
    color: { bg: "rgba(94,106,210,0.12)", fg: "#c9c4ff" },
    icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><circle cx="9" cy="6.5" r="3"/><path d="M3 16c1-3 3-4.5 6-4.5s5 1.5 6 4.5"/></svg>,
    title: "People",
    desc: "Background checks, training, least‑privilege access — and the kind of culture where pushing back on a risky deploy is welcome.",
    items: ["Background check on hire", "Security training: hire + annual", "MFA on every internal account", "Quarterly access review"],
  },
  {
    type: "platform",
    color: { bg: "rgba(78,201,216,0.12)", fg: T.cyan },
    icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><rect x="2" y="4" width="14" height="3"/><rect x="2" y="11" width="14" height="3"/><circle cx="5" cy="5.5" r="0.7" fill="currentColor"/><circle cx="5" cy="12.5" r="0.7" fill="currentColor"/></svg>,
    title: "Platform",
    desc: "The infrastructure your data sits on. Encryption at rest and in transit by default — and we use the same SOC 2'd subprocessors your enterprise vendors do.",
    items: ["TLS 1.3 · HSTS preloaded", "AES‑256 at rest (Supabase)", "RLS on every tenant table", "Daily encrypted backups · 35d"],
  },
  {
    type: "product",
    color: { bg: "rgba(74,222,128,0.10)", fg: T.hot },
    icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M9 2L3 4v5c0 4 6 7 6 7s6-3 6-7V4z"/><path d="M6.5 9l2 2 3-4"/></svg>,
    title: "Product",
    desc: "How your data flows through IntentIQ — and what we deliberately don't do with it (e.g. train models on it).",
    items: ["SHA‑256 hashed API keys", "No model training on Customer Data", "Anthropic zero‑retention enforced", "One‑click account deletion"],
  },
  {
    type: "process",
    color: { bg: "rgba(245,181,68,0.10)", fg: T.warm },
    icon: <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><circle cx="9" cy="9" r="6.5"/><path d="M9 5v4l3 1.5"/></svg>,
    title: "Process",
    desc: "How we ship, audit, and respond. Including the postmortem you're allowed to ask for after any incident — they're written for customers, not just internal.",
    items: ["Annual third‑party pen test", "72‑hour breach notification", "Public status page · 99.97% SLA", "Public postmortems within 5 days"],
  },
];

/* ── Architecture nodes ──────────────────────────────────────── */
const ARCH_COLS = [
  {
    label: "Ingress",
    nodes: [
      { ic: "UI",  grad: "linear-gradient(135deg,#4ec9d8,#5e6ad2)", name: "Customer browser", sub: "intentiq.dev",         tag: "TLS 1.3", tagClass: "tls" },
      { ic: "API", grad: "linear-gradient(135deg,#f5b544,#ec4899)", name: "REST clients",      sub: "api.intentiq.dev",     tag: "TLS 1.3", tagClass: "tls" },
    ],
  },
  {
    label: "Edge · auth",
    nodes: [
      { ic: "VC", grad: "linear-gradient(135deg,#7170ff,#c9c4ff)", name: "Vercel Edge",    sub: "us‑east‑1 · WAF",              tag: "Rate limit", tagClass: "rate" },
      { ic: "CK", grad: "linear-gradient(135deg,#4ade80,#22c55e)", name: "Clerk auth",     sub: "SHA‑256 keys",                 tag: "",           tagClass: "" },
      { ic: "RD", grad: "linear-gradient(135deg,#ec4899,#f87171)", name: "Upstash Redis",  sub: "cache · 24h TTL",              tag: "",           tagClass: "" },
    ],
  },
  {
    label: "Storage · AI",
    nodes: [
      { ic: "SB", grad: "linear-gradient(135deg,#c9c4ff,#4ec9d8)", name: "Supabase Postgres",  sub: "us‑east‑1 · AES‑256",                tag: "RLS",        tagClass: "rls" },
      { ic: "AN", grad: "linear-gradient(135deg,#4ec9d8,#4ade80)", name: "Anthropic Claude",   sub: "summary · copilot",                  tag: "Zero‑retain",tagClass: "zr" },
      { ic: "SG", grad: "linear-gradient(135deg,#7170ff,#5e6ad2)", name: "Signal vendors",     sub: "Explorium · GNews · BuiltWith",       tag: "",           tagClass: "" },
    ],
  },
];

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  tls:  { bg: "rgba(78,201,216,0.12)",  fg: T.cyan   },
  rls:  { bg: "rgba(94,106,210,0.12)",  fg: "#c9c4ff" },
  zr:   { bg: "rgba(74,222,128,0.10)",  fg: T.hot    },
  rate: { bg: "rgba(245,181,68,0.10)",  fg: T.warm   },
};

/* ── Controls ────────────────────────────────────────────────── */
const CONTROLS = [
  { name: "Encryption · transit",   ref: "CC6.1 · CC6.7",         body: <span>All traffic to <Code>intentiq.dev</Code> uses <Strong>TLS 1.3</Strong> with strong ciphers; HSTS preloaded on the apex; certificates from Let&rsquo;s Encrypt auto‑rotated every 60 days. Internal service‑to‑service hops use mTLS where the subprocessor supports it.</span> },
  { name: "Encryption · at rest",   ref: "CC6.1",                  body: <span><Strong>AES‑256</Strong> on Supabase Postgres and Vercel Blob; key management by the underlying provider with key rotation per their published schedule. We do not hold our own KMS keys today.</span> },
  { name: "Tenant isolation",       ref: "CC6.6",                  body: <span>Every multi‑tenant table enforces <Strong>Postgres Row‑Level Security</Strong> against the authenticated user&rsquo;s tenant ID. Queries cannot omit the tenant predicate — RLS is enforced at the DB, not the application layer.</span> },
  { name: "API authentication",     ref: "CC6.1 · CC6.6",          body: <span>API keys are bearer tokens, displayed once on creation, then stored as <Strong>SHA‑256 hashes</Strong>. Per‑user rate limits with Upstash; lockout on 10 failed attempts in 60s. Revocation propagates within 30 seconds.</span> },
  { name: "Internal access",        ref: "CC6.1 · CC6.2 · CC6.3",  body: <span>Engineers access production via SSO + hardware MFA only. <Strong>No standing access to customer data.</Strong> Just‑in‑time access requires a Slack request, an approver, and is auto‑revoked after 4 hours. All access logged with reason.</span> },
  { name: "Audit logging",          ref: "CC7.1 · CC7.2",          body: <span>Admin actions, auth events, and access to sensitive routes are logged with actor, IP, and result. Logs are retained <Strong>12 months</Strong> and shipped to a separate, write‑only sink to prevent tampering by the application.</span> },
  { name: "Vulnerability management",ref: "CC7.1",                 body: <span>Dependency scanning via GitHub Dependabot on every commit. Critical CVEs patched within 48 hours; high within 7 days. <Strong>Third‑party penetration test every 12 months</Strong>; summary available under NDA.</span> },
  { name: "Backups & resilience",   ref: "A1.2 · A1.3",            body: <span>Daily encrypted database backups with 35‑day retention; point‑in‑time recovery to any second within the last 7 days. <Strong>RPO 24h, RTO 4h.</Strong> DR drills run twice per year; latest drill recovered the full stack in 1h 42m.</span> },
  { name: "Incident response",      ref: "CC7.3 · CC7.5",          body: <span>On‑call rotation with paging. Severity ladder published internally; SEV‑1 invokes a war room within 10 minutes. <Strong>Customer notification within 72 hours</Strong> of confirmed Personal Data Breach per GDPR Art. 33. Postmortem within 5 business days.</span> },
  { name: "AI processing",          ref: "CC9.1 · Customer policy", body: <span>Anthropic configured with <Strong>zero data retention</Strong>; prompts are not used for training; no PII included in prompts. Customers can disable AI features per workspace. BYO Anthropic key on Pro and Agency plans.</span> },
  { name: "Personnel",              ref: "CC1.4",                  body: <span>Background checks on hire (criminal, employment, education). Confidentiality agreements signed before access. <Strong>Security training</Strong> on hire and annually. Offboarding revokes all access within 1 hour of last day.</span> },
  { name: "Physical security",      ref: "CC6.4",                  body: <span>IntentIQ operates no data centers. All production hosting is at SOC 2 and ISO 27001 certified subprocessors (Vercel, Supabase, Upstash). Office spaces are subleased; no production data on local devices.</span> },
];

/* ── Resources ───────────────────────────────────────────────── */
const RESOURCES = [
  { label: "PDF · NDA required", title: "SOC 2 Type II report",         meta: "Feb 2026 · Clean opinion · 42 pages",          href: "#",                   icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M3 2h7l2 2v8H3zM10 2v3h3"/></svg> },
  { label: "Auto‑signed · public", title: "Data Processing Agreement",  meta: "v1.6 · GDPR Art. 28 · SCCs included",          href: "/legal/dpa",          icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M3 2h8v10H3z"/><path d="M5 6h4M5 8h3"/></svg> },
  { label: "Spreadsheet",          title: "CAIQ Lite · SIG Core (pre‑filled)", meta: "Updated May '26 · 287 questions",       href: "#",                   icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><rect x="2" y="3" width="10" height="8" rx="1"/><path d="M5 6h4M5 8h2"/></svg> },
  { label: "Public · live",        title: "Subprocessor inventory",      meta: "9 subprocessors · 30‑day change notice",       href: "/legal/subprocessors",icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="4" cy="4" r="2"/><circle cx="10" cy="4" r="2"/><circle cx="7" cy="10" r="2"/></svg> },
  { label: "Live",                  title: "Status page · uptime history",meta: "status.intentiq.dev · 99.97% / 90d",          href: "#",                   icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="7" cy="7" r="5"/><path d="M7 4v3l2 2"/></svg> },
  { label: "PDF",                   title: "Security one‑pager",          meta: "For a 5‑minute review",                       href: "#",                   icon: <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M2 7l4-4h6v8H6z"/></svg> },
];

/* ── Main component ──────────────────────────────────────────── */
export default function SecurityView() {
  return (
    <div style={{ background: T.bg, color: T.txtPrimary, fontFamily: T.fontSans, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" } as React.CSSProperties}>
      <style>{`
        html { scroll-behavior: smooth; }
        .rc:hover { border-color: rgba(255,255,255,0.13) !important; background: rgba(255,255,255,0.018) !important; }
        .rc:hover .rc-arrow { color: #f7f8f8 !important; transform: translateX(2px) !important; }
      `}</style>

      {/* ── Sticky banner ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: T.txtSecondary, background: "rgba(8,9,10,0.92)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: `1px solid ${T.border}`, letterSpacing: "-0.011em", gap: 0 } as React.CSSProperties}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginRight: "10px", fontSize: "11px", fontWeight: 600, color: T.cyan, background: T.cyanSoft, padding: "1px 8px", borderRadius: "999px" }}>SOC 2</span>
        <strong style={{ color: T.txtPrimary, fontWeight: 500 }}>Type II audit complete</strong>
        <span style={{ margin: "0 6px", color: T.txtQuaternary }}>·</span>
        Feb 2026 · clean report
        <span style={{ margin: "0 10px", color: T.txtQuaternary }}>·</span>
        <a href="#reports" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: T.txtSecondary, textDecoration: "none" }}>
          Get the report
          <svg style={{ width: "12px", height: "12px" }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h6M7 4l2 2-2 2"/></svg>
        </a>
      </div>

      {/* ── Sticky nav ── */}
      <nav style={{ position: "sticky", top: "36px", zIndex: 50, background: "rgba(8,9,10,0.72)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: `1px solid ${T.border}` } as React.CSSProperties}>
        <div style={{ display: "flex", alignItems: "center", height: "56px", padding: "0 24px", maxWidth: "1320px", margin: "0 auto", gap: "28px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600, letterSpacing: "-0.022em", fontSize: "15px", color: T.txtPrimary, textDecoration: "none" }}>
            <div style={{ width: "22px", height: "22px", display: "grid", placeItems: "center", borderRadius: "5px", background: "linear-gradient(140deg, #4ec9d8 0%, #5e6ad2 70%, #7170ff 100%)", color: "#0a0b0f", fontWeight: 800, fontSize: "11px", fontFamily: T.fontMono, boxShadow: "0 2px 8px rgba(94,106,210,0.4)" }}>IQ</div>
            IntentIQ
          </Link>
          <div style={{ display: "flex", gap: "4px" }}>
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} style={{ display: "inline-flex", alignItems: "center", fontSize: "14px", color: T.txtSecondary, padding: "6px 10px", borderRadius: "6px", letterSpacing: "-0.011em", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <Link href="/login" style={{ fontSize: "14px", fontWeight: 500, color: T.txtSecondary, padding: "6px 10px", borderRadius: "6px", textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", fontSize: "14px", fontWeight: 500, color: T.txtPrimary, padding: "0 14px", height: "32px", borderRadius: "6px", border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.05)", textDecoration: "none" }}>Start free</Link>
          <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 500, color: "#fff", padding: "0 14px", height: "32px", borderRadius: "6px", background: T.accent, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.3)", textDecoration: "none" }}>
            Talk to us
            <svg style={{ width: "12px", height: "12px" }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h6M7 4l2 2-2 2"/></svg>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", padding: "88px 0 0", overflow: "hidden", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
          <div style={{ position: "absolute", left: "50%", top: "-200px", width: "1100px", height: "560px", transform: "translateX(-50%)", background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(94,106,210,0.20), transparent 60%), radial-gradient(ellipse 40% 70% at 30% 30%, rgba(78,201,216,0.13), transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)" } as React.CSSProperties} />
        </div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto", padding: "0 24px 64px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 500, color: T.txtSecondary, letterSpacing: "-0.011em", marginBottom: "22px" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: T.cyan, boxShadow: "0 0 8px #4ec9d8", display: "block" }} />
            Trust · Security
          </div>
          <h1 style={{ fontWeight: 500, letterSpacing: "-0.042em", lineHeight: 1, fontSize: "clamp(40px, 6.4vw, 76px)", marginBottom: "22px", color: T.txtPrimary }}>
            Security at{" "}
            <span style={{ background: "linear-gradient(135deg, #4ec9d8 0%, #5e6ad2 50%, #7170ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } as React.CSSProperties}>IntentIQ.</span>
          </h1>
          <p style={{ maxWidth: "580px", color: T.txtSecondary, fontSize: "clamp(16px, 1.25vw, 19px)", lineHeight: 1.55, letterSpacing: "-0.011em", marginBottom: "40px" }}>
            The full picture: certifications, the architecture diagram, every control we run, and the email address you use to tell us when something looks wrong. Built and audited as if your CISO were reading.
          </p>

          {/* Certifications grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1px", background: T.borderSubtle, border: `1px solid ${T.borderSubtle}`, borderRadius: "12px", overflow: "hidden" }}>
            {CERTS.map((c) => (
              <div key={c.badge} style={{ background: T.bg, padding: "22px 18px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "6px", display: "grid", placeItems: "center", fontFamily: T.fontMono, fontSize: "11px", fontWeight: 700, color: "#0a0b0f", letterSpacing: "-0.02em", marginBottom: "4px", background: c.grad }}>{c.badge}</div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: T.txtPrimary, letterSpacing: "-0.011em" }}>{c.name}</div>
                <div style={{ fontFamily: T.fontMono, fontSize: "10px", color: T.txtTertiary, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{c.meta}</div>
                <div style={{ marginTop: "auto", paddingTop: "8px", display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: c.pending ? T.warm : T.hot, fontFamily: T.fontMono, letterSpacing: "0.04em" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: c.pending ? T.warm : T.hot, boxShadow: `0 0 6px ${c.pending ? T.warm : T.hot}`, display: "block" }} />
                  {c.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four pillars ── */}
      <section style={{ padding: "88px 0 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 0" }}>
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 500, color: T.txtTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: T.cyan, display: "block" }} />
              How security is structured
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1, color: T.txtPrimary }}>
              Four pillars.<br />
              <span style={{ color: T.txtTertiary }}>Every control rolls up to one of them.</span>
            </h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: T.borderSubtle, borderTop: `1px solid ${T.borderSubtle}`, borderBottom: `1px solid ${T.borderSubtle}` }}>
          {PILLARS.map((p) => (
            <div key={p.type} style={{ background: T.bg, padding: "32px 28px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ width: "36px", height: "36px", display: "grid", placeItems: "center", borderRadius: "6px", marginBottom: "4px", background: p.color.bg, color: p.color.fg }}>{p.icon}</div>
              <h3 style={{ fontSize: "18px", fontWeight: 500, letterSpacing: "-0.018em", lineHeight: 1.2, color: T.txtPrimary }}>{p.title}</h3>
              <p style={{ fontSize: "14px", lineHeight: 1.55, color: T.txtTertiary, letterSpacing: "-0.006em" }}>{p.desc}</p>
              <ul style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "6px", paddingTop: "14px", borderTop: `1px solid ${T.borderSubtle}`, padding: "14px 0 0", listStyle: "none" }}>
                {p.items.map((item) => (
                  <li key={item} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12px", color: T.txtSecondary, letterSpacing: "-0.006em", lineHeight: 1.4 }}>
                    <svg style={{ width: "12px", height: "12px", flexShrink: 0, marginTop: "2px", color: T.hot }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6l2 2 4-5"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture ── */}
      <section style={{ padding: "88px 0 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 500, color: T.txtTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: T.cyan, display: "block" }} />
              Data flow
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1, color: T.txtPrimary, marginBottom: "16px" }}>
              Where your data goes,<br />step by step.
            </h2>
            <p style={{ fontSize: "16px", color: T.txtTertiary, lineHeight: 1.55, letterSpacing: "-0.006em", maxWidth: "560px" }}>
              Five hops from a customer&rsquo;s browser to a scored response. Encryption in transit at every hop; nothing&rsquo;s logged that doesn&rsquo;t need to be.
            </p>
          </div>

          {/* Architecture diagram */}
          <div style={{ border: `1px solid ${T.border}`, borderRadius: "12px", background: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0) 0 0 / 18px 18px, ${T.bgEl}`, padding: "40px 32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(94,106,210,0.06), transparent 60%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 80px 1fr 80px 1fr", alignItems: "stretch", maxWidth: "1080px", margin: "0 auto" }}>
              {ARCH_COLS.map((col, ci) => (
                <>
                  <div key={col.label} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontFamily: T.fontMono, fontSize: "10px", color: T.txtQuaternary, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px", textAlign: "center" }}>{col.label}</div>
                    {col.nodes.map((n) => (
                      <div key={n.ic} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "24px", height: "24px", flexShrink: 0, borderRadius: "5px", display: "grid", placeItems: "center", fontFamily: T.fontMono, fontSize: "9px", fontWeight: 700, color: "#0a0b0f", background: n.grad }}>{n.ic}</div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: T.txtPrimary, letterSpacing: "-0.011em" }}>{n.name}</div>
                          <div style={{ fontFamily: T.fontMono, fontSize: "10px", color: T.txtTertiary, letterSpacing: "0.02em" }}>{n.sub}</div>
                        </div>
                        {n.tag && n.tagClass && TAG_COLORS[n.tagClass] && (
                          <span style={{ fontFamily: T.fontMono, fontSize: "9px", padding: "1px 6px", borderRadius: "999px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, background: TAG_COLORS[n.tagClass].bg, color: TAG_COLORS[n.tagClass].fg }}>{n.tag}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {ci < ARCH_COLS.length - 1 && (
                    <div key={`edge-${ci}`} style={{ display: "grid", placeItems: "center", position: "relative" }}>
                      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", background: "repeating-linear-gradient(90deg, #62666d 0 4px, transparent 4px 8px)" }} />
                      <div style={{ position: "relative", zIndex: 2, width: "22px", height: "22px", background: T.bgEl, border: `1px solid ${T.border}`, borderRadius: "999px", display: "grid", placeItems: "center", color: T.txtSecondary }}>
                        <svg style={{ width: "10px", height: "10px" }} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h7M8 4l3 3-3 3"/></svg>
                      </div>
                    </div>
                  )}
                </>
              ))}
            </div>
          </div>

          <p style={{ marginTop: "20px", fontSize: "13px", color: T.txtTertiary, letterSpacing: "-0.006em", lineHeight: 1.55, maxWidth: "640px" }}>
            For the full subprocessor list with regions, transfer mechanisms, and DPA links, see{" "}
            <Link href="/legal/subprocessors" style={{ color: T.txtPrimary, textDecoration: "underline", textDecorationColor: T.borderStrong }}>Subprocessors</Link>.
            {" "}We notify account owners <strong style={{ color: T.txtPrimary, fontWeight: 500 }}>30 days before</strong> any change to this set.
          </p>
        </div>
      </section>

      {/* ── Controls ── */}
      <section style={{ padding: "88px 0 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 500, color: T.txtTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: T.cyan, display: "block" }} />
              Controls in detail
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1, color: T.txtPrimary, marginBottom: "16px" }}>
              The twelve things<br />your CISO will ask about.
            </h2>
            <p style={{ fontSize: "16px", color: T.txtTertiary, lineHeight: 1.55, letterSpacing: "-0.006em", maxWidth: "560px" }}>
              If a control isn&rsquo;t here, it&rsquo;s because we don&rsquo;t run it — and we&rsquo;ll tell you that, in writing, instead of waving the SOC 2 report.
            </p>
          </div>

          <div>
            {CONTROLS.map((c, i) => (
              <div key={c.name} style={{ display: "grid", gridTemplateColumns: "180px 1fr 130px", gap: "24px", padding: "20px 0", borderBottom: i < CONTROLS.length - 1 ? `1px solid ${T.borderSubtle}` : "none", alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: T.txtPrimary, letterSpacing: "-0.011em", marginBottom: "4px" }}>{c.name}</div>
                  <div style={{ fontFamily: T.fontMono, fontSize: "10px", color: T.txtQuaternary, letterSpacing: "0.04em" }}>{c.ref}</div>
                </div>
                <div style={{ fontSize: "14px", color: T.txtSecondary, lineHeight: 1.6, letterSpacing: "-0.006em" }}>{c.body}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: T.fontMono, fontSize: "11px", color: T.hot, letterSpacing: "0.04em", textTransform: "uppercase" as const, padding: "3px 9px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: "999px", height: "fit-content", whiteSpace: "nowrap" as const }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: T.hot, boxShadow: `0 0 6px ${T.hot}`, display: "block" }} />
                  Active
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Resources ── */}
      <section id="reports" style={{ padding: "88px 0 96px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 500, color: T.txtTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: T.cyan, display: "block" }} />
              For your procurement team
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1, color: T.txtPrimary, marginBottom: "12px" }}>
              Everything you need<br />to fast‑track us.
            </h2>
            <p style={{ fontSize: "16px", color: T.txtTertiary, lineHeight: 1.55, letterSpacing: "-0.006em", maxWidth: "480px" }}>
              Pre‑filled questionnaires, the SOC 2 report, the DPA, and a one‑pager you can drop into a security review.
            </p>
          </div>

          {/* Resource cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {RESOURCES.map((r) => (
              <Link key={r.title} href={r.href} className="rc" style={{ border: `1px solid ${T.border}`, borderRadius: "8px", background: T.bgEl, padding: "18px 20px", display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer", transition: "border-color 0.15s, background 0.15s", textDecoration: "none" }}>
                <div style={{ width: "30px", height: "30px", display: "grid", placeItems: "center", borderRadius: "5px", background: "rgba(94,106,210,0.12)", color: "#c9c4ff", flexShrink: 0 }}>{r.icon}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: "10px", color: T.txtQuaternary, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "2px" }}>{r.label}</div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: T.txtPrimary, letterSpacing: "-0.011em", marginBottom: "4px" }}>{r.title}</div>
                  <div style={{ fontSize: "12px", color: T.txtTertiary, letterSpacing: "-0.006em" }}>{r.meta}</div>
                </div>
                <svg className="rc-arrow" style={{ width: "12px", height: "12px", color: T.txtQuaternary, transition: "transform 0.2s, color 0.2s", flexShrink: 0, marginTop: "4px" }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h6M7 4l2 2-2 2"/></svg>
              </Link>
            ))}
          </div>

          {/* Vulnerability reporting card */}
          <div style={{ marginTop: "48px", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "12px", background: `radial-gradient(ellipse 80% 60% at 100% 0%, rgba(74,222,128,0.04), transparent 60%), ${T.bgEl}`, padding: "36px 40px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "32px", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "-0.022em", color: T.txtPrimary, marginBottom: "8px" }}>Found something? Tell us.</h3>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: T.txtTertiary, letterSpacing: "-0.006em", maxWidth: "480px", marginBottom: "14px" }}>
                We pay bounties up to <strong style={{ color: T.txtPrimary, fontWeight: 500 }}>$5,000</strong> for severe issues, settled in 14 days. No legal threats for good‑faith research. Encrypt your report with the PGP key on the right — or just email <Code>security@intentiq.dev</Code> in the clear.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <a href="mailto:security@intentiq.dev" style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 500, color: "#fff", background: T.accent, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.3)", textDecoration: "none" }}>
                  Email security@intentiq.dev
                  <svg style={{ width: "12px", height: "12px" }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h6M7 4l2 2-2 2"/></svg>
                </a>
                <button style={{ display: "inline-flex", alignItems: "center", height: "36px", padding: "0 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 500, color: T.txtPrimary, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, cursor: "pointer", fontFamily: T.fontSans }}>Disclosure policy</button>
              </div>
            </div>
            <div style={{ fontFamily: T.fontMono, fontSize: "11px", color: T.txtTertiary, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: "6px", padding: "14px 16px", lineHeight: 1.55, letterSpacing: "0.02em" }}>
              <span style={{ color: T.txtQuaternary, textTransform: "uppercase" as const, fontSize: "10px", display: "block", marginBottom: "6px", letterSpacing: "0.06em" }}>PGP fingerprint · security@intentiq.dev</span>
              <span style={{ color: T.txtPrimary, wordBreak: "break-all" as const }}>8C42 9B17 D6E3 7F4A 1C0E&nbsp;&nbsp;5D8A 9F36 A1B2 04EC 7F31</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Site footer ── */}
      <footer style={{ padding: "64px 0 36px", borderTop: `1px solid ${T.border}`, background: "#050608" }}>
        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, 1fr)", gap: "32px", marginBottom: "56px" }}>
            <div>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600, letterSpacing: "-0.022em", fontSize: "15px", color: T.txtPrimary, textDecoration: "none" }}>
                <div style={{ width: "22px", height: "22px", display: "grid", placeItems: "center", borderRadius: "5px", background: "linear-gradient(140deg, #4ec9d8 0%, #5e6ad2 70%, #7170ff 100%)", color: "#0a0b0f", fontWeight: 800, fontSize: "11px", fontFamily: T.fontMono, boxShadow: "0 2px 8px rgba(94,106,210,0.4)" }}>IQ</div>
                IntentIQ
              </Link>
              <p style={{ marginTop: "16px", fontSize: "13px", lineHeight: 1.55, color: T.txtQuaternary, letterSpacing: "-0.006em", maxWidth: "260px" }}>
                B2B intent scoring for sales teams that close. From $29/mo. Built in Cairo, San Francisco, and on the train.
              </p>
            </div>
            {[
              { title: "Product",    links: [{ l: "Score", h: "/#" }, { l: "Intent Hub", h: "/#" }, { l: "Autopilot", h: "/#" }, { l: "People scoring", h: "/#" }, { l: "Watchlist", h: "/#" }, { l: "Changelog", h: "/#" }] },
              { title: "Developers", links: [{ l: "API reference", h: "/docs" }, { l: "Webhooks", h: "/#" }, { l: "SDKs", h: "/#" }, { l: "Status", h: "/#" }, { l: "Integrations", h: "/#" }] },
              { title: "Company",    links: [{ l: "About", h: "/#" }, { l: "Customers", h: "/#" }, { l: "Pricing", h: "/#pricing" }, { l: "Careers", h: "/#" }, { l: "Blog", h: "/#" }, { l: "Contact", h: "/contact" }] },
              { title: "Legal",      links: [{ l: "Terms", h: "/terms" }, { l: "Privacy", h: "/privacy" }, { l: "DPA", h: "/legal/dpa" }, { l: "Security", h: "/legal/security" }, { l: "Subprocessors", h: "/legal/subprocessors" }] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: "12px", fontWeight: 500, color: T.txtSecondary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>{col.title}</h4>
                <ul style={{ display: "flex", flexDirection: "column", gap: "8px", padding: 0, listStyle: "none", margin: 0 }}>
                  {col.links.map(({ l, h }) => (
                    <li key={l}><Link href={h} style={{ fontSize: "13px", color: T.txtQuaternary, letterSpacing: "-0.006em", textDecoration: "none" }}>{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "28px", borderTop: `1px solid ${T.border}`, fontSize: "12px", color: T.txtQuaternary, letterSpacing: "-0.006em" }}>
            <span>© {new Date().getFullYear()} IntentIQ Labs, Inc. All rights reserved.</span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
              <span>All systems operational</span>
            </div>
            <div style={{ display: "flex", gap: "18px" }}>
              {["Twitter", "GitHub", "LinkedIn"].map(s => (
                <a key={s} href="#" style={{ color: T.txtQuaternary, textDecoration: "none" }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
