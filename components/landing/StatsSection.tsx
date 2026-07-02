const STATS = [
  { value: "2.4M", label: "Accounts scored to date", color: "text-[#e8ff40]" },
  { value: "<3s", label: "Median time to first score", color: "text-[#e8ff40]" },
  { value: "+38%", label: "Avg lift in HOT band reply rate", color: "text-[#4ade80]" },
  { value: "99.97%", label: "API uptime, last 90 days", color: "text-[#f7f8f8]" },
];

export default function StatsSection() {
  return (
    <section className="border-b border-white/[0.06] px-5 py-16 md:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e1011]">
        <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-white/[0.08]">
          {STATS.map((s) => (
            <div key={s.label} className="px-6 py-8 text-center md:py-10">
              <p className={`font-mono text-3xl font-semibold tracking-tight md:text-4xl ${s.color}`}>{s.value}</p>
              <p className="mt-2 text-[13px] text-[#8a8f98]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
