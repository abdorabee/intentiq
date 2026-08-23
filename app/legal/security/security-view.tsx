import Link from "next/link";

import SiteFooter from "@/components/site-footer";
import VesperWiseLogo from "@/components/vesperwise-logo";

const facts = [
  { title: "Identity and account security", body: "Clerk authenticates users and provides profile, email, password, multi-factor authentication, and session management. Configuration alone cannot enable the embedded account surface: the database must record a signed update probe and a later successful signed delete probe for the same dedicated test user and exact lifecycle contract version." },
  { title: "Application-scoped customer data", body: "Authenticated server routes derive the Clerk user ID from the session and apply that owner ID to Supabase queries. Server code uses a Supabase service-role credential, which bypasses Row Level Security, so application-side authentication, owner filters, response validation, and narrow database functions are the active tenant boundary." },
  { title: "API credentials", body: "API key secrets are displayed once. VesperWise stores only SHA-256 hashes, verifies created and revoked rows against the authenticated Clerk user, and enforces active-key plan limits in a serialized database transaction." },
  { title: "AI processing", body: "VesperWise routes supported reasoning requests through OpenRouter to configured models. The current product does not offer bring-your-own model keys or a workspace-wide AI disable control." },
  { title: "Analytics choice", body: "Google Analytics is loaded in the authenticated product only after persisted analytics consent is enabled. Changing that preference updates consent immediately; disabling it sends a denied consent update and stops rendering the GA loader and configuration scripts." },
];

export default function SecurityView() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <nav className="border-b border-white/10 bg-[#08090a]/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <Link href="/" aria-label="VesperWise home"><VesperWiseLogo size={42} variant="wordmark" /></Link>
          <div className="flex-1" />
          <Link href="/privacy" className="text-sm text-slate-400 hover:text-white">Privacy</Link>
          <Link href="/privacy#s5" className="text-sm text-slate-400 hover:text-white">Privacy &amp; providers</Link>
          <Link href="/contact" className="border border-white/15 px-3 py-2 text-sm">Contact</Link>
        </div>
      </nav>

      <main>
        <section className="border-b border-white/10 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#dfff00]">Security overview</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-6xl">How VesperWise protects product access and data.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400">This page describes controls visible in the current code and product. It is not a certification report, uptime commitment, penetration-test statement, or representation of a backup or disaster-recovery schedule.</p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-4xl gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
            {facts.map((fact) => (
              <article key={fact.title} className="bg-[#0e1011] p-6">
                <h2 className="text-base font-medium">{fact.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{fact.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-medium">Questions or a vulnerability report</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Send security questions and good-faith vulnerability reports to <a className="text-white underline underline-offset-4" href="mailto:security@vesperwise.com">security@vesperwise.com</a>. Do not include secrets, credentials, or customer data in the first message.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/privacy" className="border border-white/15 px-4 py-2 text-sm">Privacy policy</Link>
              <Link href="/privacy#s5" className="border border-white/15 px-4 py-2 text-sm">Privacy &amp; providers</Link>
              <Link href="/terms" className="border border-white/15 px-4 py-2 text-sm">Terms</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
