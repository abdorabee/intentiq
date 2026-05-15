export default function LogoStrip() {
  const logos = ["Roundwave", "Signaltree", "MERIDIAN", "Carbide", "Northbeam", "[ HALCYON ]"];
  return (
    <section className="border-y border-white/[0.06] bg-[#0e1011] py-12">
      <p className="mb-8 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[#62666d]">
        Powering pipelines at sales orgs you&apos;ve heard of
      </p>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5">
        {logos.map((name) => (
          <span key={name} className="text-sm font-semibold tracking-tight text-[#3d4249]">
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
