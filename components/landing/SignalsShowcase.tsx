import SectionLabel from "./SectionLabel";
import ScanlineRow from "./ScanlineRow";
import { SIGNALS } from "./data";

export default function SignalsShowcase() {
  return (
    <section id="signals" className="border-b border-white/[0.06] bg-[#0a0b0d] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionLabel text="Signals" />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#f7f8f8] md:text-3xl">Five signals. One intent score.</h2>
        <p className="mt-2 text-sm text-[#8a8f98]">Five live data signals, weighted and scored in real time.</p>
        <div className="mt-10">
          {SIGNALS.map((signal) => (
            <ScanlineRow
              key={signal.name}
              left={
                <div>
                  <p className="text-sm font-bold tracking-wide text-[#f7f8f8] md:text-base">{signal.name}</p>
                  <p className="mt-1 text-xs text-[#8a8f98] md:text-sm">{signal.category}</p>
                </div>
              }
              right={<span className="text-lg font-bold tracking-wide text-[#c9c4ff] md:text-xl">{signal.weight}</span>}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
