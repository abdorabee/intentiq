import SectionLabel from "./SectionLabel";
import ScanlineRow from "./ScanlineRow";
import { HOW_IT_WORKS } from "./data";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-white/[0.06] bg-[#08090a] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionLabel text="Process" />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#f7f8f8] md:text-3xl">How it works</h2>
        <p className="mt-2 text-sm text-[#8a8f98]">From domain to deal signal in under 3 seconds.</p>
        <div className="mt-10">
          {HOW_IT_WORKS.map((item) => (
            <ScanlineRow
              key={item.step}
              left={
                <div className="flex items-center gap-4 md:gap-6">
                  <span className="shrink-0 text-xl font-bold tracking-wide text-[#e8ff40] md:text-2xl">{item.step}</span>
                  <span className="text-sm font-semibold tracking-wide text-[#f7f8f8] md:text-base">{item.title}</span>
                </div>
              }
              right={
                <p className="hidden max-w-xs text-right text-xs leading-relaxed text-[#8a8f98] md:block md:text-sm">
                  {item.body}
                </p>
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
