export default function AutopilotFeatureSection() {
  return (
    <section id="autopilot" className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="inline-flex items-center gap-2 text-[13px] text-[#8a8f98]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ec9d8]" />
          Autopilot
        </p>
        <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.03em] text-[#f7f8f8] md:text-4xl md:leading-tight">
          Workflows that fire while
          <br />
          the buying window is open.
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#8a8f98]">
          Trigger on score crossings, signal spikes, or pipeline events. Branch on conditions. Route, draft, notify —
          without leaving VesperWise.
        </p>
        <div className="mt-12 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0b0d]">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-[11px]">
            <span className="font-mono text-[#b4bbc8]">when_account_goes_hot</span>
            <span className="text-[#4ade80]">Active · 412 fires this month</span>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            <div className="rounded-lg border border-white/[0.08] bg-[#131517] p-4">
              <p className="text-[10px] uppercase tracking-wide text-[#7170ff]">Trigger</p>
              <p className="mt-2 text-sm font-semibold text-[#f7f8f8]">Score crosses threshold</p>
              <p className="mt-1 text-[11px] text-[#8a8f98]">Account moves from WARM into HOT band</p>
            </div>
            <span className="hidden text-center text-[#62666d] md:block">→</span>
            <div className="rounded-lg border border-white/[0.08] bg-[#131517] p-4">
              <p className="text-[10px] uppercase tracking-wide text-[#f5b544]">Condition</p>
              <p className="mt-2 text-sm font-semibold text-[#f7f8f8]">If ICP fit + segment match</p>
              <p className="mt-1 text-[11px] text-[#8a8f98]">ICP score ≥ 70 AND industry in Fintech, SaaS</p>
            </div>
            <span className="hidden text-center text-[#62666d] md:block">→</span>
            <div className="rounded-lg border border-[rgba(74,222,128,0.2)] bg-[#131517] p-4">
              <p className="text-[10px] uppercase tracking-wide text-[#4ade80]">Actions · 3</p>
              <p className="mt-2 text-sm font-semibold text-[#f7f8f8]">Route, draft, notify</p>
              <p className="mt-1 text-[11px] text-[#8a8f98]">Owner: segment closer · Email draft · Slack #pipeline</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
