const QUOTES = [
  {
    text: "We replaced our 6sense seat with VesperWise for a tenth of the cost. The AE adoption was the surprise — they read the AI summary, they don't read the dashboard.",
    name: "Sana Kapoor",
    role: "VP Sales · Roundwave",
    initials: "SK",
  },
  {
    text: "Autopilot caught a Series B announcement and routed the account to my closer at 4:42 AM. Meeting was booked by 9. That's the entire pitch.",
    name: "Marcus Ng",
    role: "Head of GTM · Northbeam",
    initials: "MN",
  },
  {
    text: "The 0–100 score is the only signal we put in our Mondays now. Reps trust it because the reasoning shows up next to the number.",
    name: "Rhea Doshi",
    role: "Sales Ops Lead · Halcyon",
    initials: "RD",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="customers" className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl text-center">
        <p className="inline-flex items-center gap-2 text-[13px] text-[#8a8f98]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#dfff00]" />
          What teams are saying
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#f7f8f8] md:text-4xl">
          &ldquo;Finally, a number my AEs
          <br />
          actually pay attention to.&rdquo;
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3 md:text-left">
          {QUOTES.map((q) => (
            <blockquote
              key={q.name}
              className="flex flex-col rounded-xl border border-white/[0.08] bg-[#0e1011] p-6"
            >
              <p className="flex-1 text-[15px] leading-relaxed text-[#b4bbc8]">&ldquo;{q.text}&rdquo;</p>
              <footer className="mt-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dfff00]/30 text-[11px] font-bold text-[#f7f8f8]">
                  {q.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#f7f8f8]">{q.name}</p>
                  <p className="text-[12px] text-[#62666d]">{q.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
