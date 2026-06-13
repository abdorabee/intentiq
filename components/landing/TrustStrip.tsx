const NAMES = ["Stripe", "Notion", "Linear", "Vercel", "Anthropic", "Figma"];

export default function TrustStrip() {
  return (
    <section id="customers" className="border-y border-white/[0.06] bg-[#08090a] py-10">
      <p className="mb-6 text-center font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#62666d]">
        Teams shipping pipeline intelligence with VesperWise
      </p>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 opacity-80">
        {NAMES.map((n) => (
          <span key={n} className="text-sm font-semibold tracking-tight text-[#3d4249]">
            {n}
          </span>
        ))}
      </div>
    </section>
  );
}
