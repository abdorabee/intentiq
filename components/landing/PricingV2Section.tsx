import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING, COMPARISON } from "./data";

const DISPLAY_PLANS = PRICING.filter((p) => p.plan !== "Agency");

export default function PricingV2Section() {
  return (
    <section id="pricing" className="border-b border-white/[0.06] px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-[13px] text-[#8a8f98]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#dfff00]" />
            Pricing
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#f7f8f8] md:text-4xl">
            Start free.
            <br />
            Pay when you close.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-[#8a8f98]">
            One credit = one account scored. Bulk and re-scores included. Cancel anytime — no annual contracts.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DISPLAY_PLANS.map((p) => (
            <div
              key={p.plan}
              className={`flex flex-col rounded-xl border p-5 ${
                p.highlight
                  ? "border-[#dfff00]/40 bg-gradient-to-b from-[#dfff00]/10 to-[#0e1011] shadow-[0_0_40px_rgba(223,255,0,0.15)]"
                  : "border-white/[0.08] bg-[#0e1011]"
              }`}
            >
              {p.highlight && (
                <span className="mb-3 w-fit rounded-full bg-[#dfff00] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
                  Most popular
                </span>
              )}
              <p className="text-sm text-[#8a8f98]">{p.plan}</p>
              <p className="mt-1 text-3xl font-semibold text-[#f7f8f8]">
                {p.price}
                <span className="text-base font-normal text-[#62666d]">/mo</span>
              </p>
              <p className="mt-1 text-[12px] text-[#8a8f98]">
                <strong className="text-[#f7f8f8]">{p.credits}</strong> account scores
                {p.perScore && <span className="font-mono text-[#62666d]"> · {p.perScore} each</span>}
              </p>
              <ul className="mt-4 flex-1 space-y-2 border-t border-white/[0.06] pt-4">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-[#8a8f98]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e8ff40]" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-5 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[14px] font-medium transition-[filter,box-shadow] ${
                  p.highlight
                    ? "bg-[#dfff00] text-black shadow-[0_8px_28px_rgba(223,255,0,0.35)] hover:brightness-110"
                    : "border border-white/[0.18] text-[#e8eaed] hover:border-white/[0.28] hover:bg-white/[0.05]"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center font-mono text-[12px] text-[#62666d]">
          Need 25k+ scores?{" "}
          <Link href="/signup" className="text-[#8a8f98] underline underline-offset-2 hover:text-[#f7f8f8]">
            See Agency plan →
          </Link>
        </p>

        <div className="mt-12 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0e1011]">
                  {["Product", "Price", "SMB", "API", "AI", "MENA"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-[#62666d]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {COMPARISON.map((c) => (
                  <tr key={c.name} className={c.you ? "bg-[#dfff00]/8" : ""}>
                    <td className="px-4 py-3 text-[#b4bbc8]">
                      {c.you ? <span className="font-semibold text-[#dfff00]">{c.name}</span> : c.name}
                    </td>
                    <td className={`px-4 py-3 ${c.you ? "font-medium text-[#dfff00]" : "text-[#8a8f98]"}`}>{c.price}</td>
                    {(["smb", "api", "ai", "mena"] as const).map((k) => (
                      <td key={k} className="px-4 py-3">
                        {c[k] ? (
                          <Check className="h-4 w-4 text-[#e8ff40]" aria-label="yes" />
                        ) : (
                          <span className="text-[#3d4249]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
