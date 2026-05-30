const PILLARS = [
  {
    n: "01",
    label: "Signal",
    title: "Five live data streams, in parallel.",
    body: "Funding, hiring velocity, news triggers, tech stack, and web presence — fetched simultaneously and weighted into one score.",
  },
  {
    n: "02",
    label: "Reason",
    title: "An AI summary you'd actually paste to your boss.",
    body: "Claude reads the signals and writes a two-line buying thesis, a why-now insight, and the play to run next.",
  },
  {
    n: "03",
    label: "Act",
    title: "Workflows that fire while the window's open.",
    body: "Cross 75 and an account routes to the right owner, drafts outreach, and pings Slack — without leaving IntentIQ.",
  },
];

export default function PillarsSection() {
  return (
    <section className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl text-center">
        <p className="inline-flex items-center gap-2 text-[13px] text-[#b4bbc8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ec9d8]" />
          Made for sales teams who close
        </p>
        <h2 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-[#f7f8f8] md:text-5xl">
          Stop guessing.
        </h2>
        <p className="mt-1 text-4xl font-semibold tracking-[-0.03em] text-[#62666d] md:text-5xl">Start scoring.</p>
        <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-[#8a8f98]">
          Every signal that a deal is heating up — funding rounds, hiring spikes, news, tech adoption, traffic — fused
          into one number, with the reasoning to back it up.
        </p>
      </div>
      <div className="mx-auto mt-16 grid max-w-6xl gap-0 md:grid-cols-3 md:divide-x md:divide-white/[0.08]">
        {PILLARS.map((p) => (
          <div key={p.n} className="px-6 py-8 md:py-0 md:first:pl-0 md:last:pr-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#62666d]">
              {p.n} — {p.label}
            </p>
            <h3 className="mt-3 text-lg font-semibold tracking-tight text-[#f7f8f8]">{p.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#8a8f98]">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
