import Link from "next/link";

type FooterLink = string | { label: string; href: string };

const COLS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: ["Score", "Intent Hub", "Autopilot", "People scoring", "Watchlist", "Changelog"],
  },
  {
    title: "Developers",
    links: [{ label: "API reference", href: "/docs" }, "Webhooks", "SDKs", "Status", "Integrations"],
  },
  {
    title: "Company",
    links: ["About", "Customers", "Pricing", "Careers", "Blog", { label: "Contact", href: "/contact" }],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms",         href: "/terms" },
      { label: "Privacy",       href: "/privacy" },
      { label: "DPA",           href: "/legal/dpa" },
      { label: "Security",      href: "/legal/security" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="px-5 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5e6ad2] text-xs font-bold text-white">
                IQ
              </span>
              <span className="font-semibold text-[#f7f8f8]">IntentIQ</span>
            </Link>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#8a8f98]">
              B2B intent scoring for sales teams that close. From $29/mo. Built in Cairo, San Francisco, and on the
              train.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#f7f8f8]">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => {
                  const label = typeof link === "string" ? link : link.label;
                  const href  = typeof link === "string" ? "#"   : link.href;
                  return (
                    <li key={label}>
                      <Link href={href} className="text-[13px] text-[#8a8f98] hover:text-[#f7f8f8]">
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-[12px] text-[#62666d] md:flex-row">
          <span>© {new Date().getFullYear()} IntentIQ Labs, Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-[#8a8f98]">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-[#8a8f98]">
              Sign up
            </Link>
            <Link href="/docs" className="hover:text-[#8a8f98]">
              Docs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
