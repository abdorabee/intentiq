import Link from "next/link";
import { Button } from "@/components/ui/button";

// Color-coded JSON renderer (server-component safe, no JS needed)
function J({ k, v, indent = 1, comma = true }: {
  k?: string;
  v: string | number | boolean | null;
  indent?: number;
  comma?: boolean;
}) {
  const pad = "  ".repeat(indent);
  const keyPart = k
    ? <><span className="text-cyan-300/70">&quot;{k}&quot;</span><span className="text-zinc-500">: </span></>
    : null;
  const valNode =
    typeof v === "string"  ? <span className="text-emerald-400">&quot;{v}&quot;</span> :
    typeof v === "number"  ? <span className="text-amber-400">{v}</span> :
    typeof v === "boolean" ? <span className="text-sky-400">{String(v)}</span> :
                             <span className="text-zinc-400">null</span>;
  return (
    <div>{pad}{keyPart}{valNode}{comma && <span className="text-zinc-500">,</span>}</div>
  );
}

function TerminalHeader({ method, path, status, label }: {
  method?: string; path?: string; status?: string; label: string;
}) {
  return (
    <div className="flex items-center justify-between bg-zinc-900 px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
      </div>
      <div className="flex items-center gap-2">
        {method && (
          <span className={`text-xs font-bold ${
            method === "GET"  ? "text-emerald-400" :
            method === "POST" ? "text-amber-400"   : "text-sky-400"
          }`}>{method}</span>
        )}
        {status && <span className="text-xs font-bold text-emerald-400">{status}</span>}
        {path && <span className="text-xs font-mono text-zinc-300">{path}</span>}
      </div>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function SectionHeading({ id, badge, title, description }: {
  id: string; badge: string; title: string; description: string;
}) {
  return (
    <div id={id} className="space-y-2 pt-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] glass px-3 py-1 text-xs font-semibold text-slate-500">
        {badge}
      </div>
      <h2 className="text-2xl font-black tracking-tight text-slate-100">{title}</h2>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

const NAV_SECTIONS = [
  { id: "authentication", label: "Authentication"    },
  { id: "score",          label: "Score a Domain"    },
  { id: "bulk",           label: "Bulk Scoring"      },
  { id: "watchlist",      label: "Watchlist"         },
  { id: "errors",         label: "Error Codes"       },
  { id: "limits",         label: "Rate Limits"       },
];

export default function DocsPage() {
  return (
    <div className="relative min-h-screen bg-[#040814] overflow-x-hidden">

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-orb absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="animate-orb-slow absolute top-1/2 -right-60 h-[500px] w-[500px] rounded-full bg-blue-600/8 blur-[100px]" />
        <div className="animate-orb-med absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-400/6 blur-[90px]" />
      </div>

      {/* Top nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 glass-nav border-b border-white/[0.06]">
        <Link href="/">
          <span className="text-xl font-black text-gradient">
            IntentIQ
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-slate-400 hover:text-slate-100" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-white border-0" asChild>
            <Link href="/api-keys">Get API key</Link>
          </Button>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 space-y-20">

        {/* Page heading */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-100">API Reference</h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            RESTful API. Bearer token auth. JSON responses. All endpoints return in under 3 seconds.
          </p>
          {/* Quick endpoint index */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { method: "GET",  path: "/api/v1/score"        },
              { method: "POST", path: "/api/v1/score/bulk"   },
              { method: "GET",  path: "/api/v1/watchlist"    },
              { method: "POST", path: "/api/v1/watchlist"    },
              { method: "GET",  path: "/api/v1/prioritize"   },
            ].map((ep) => (
              <div key={ep.method + ep.path} className="flex items-center gap-2 rounded-full glass border-white/[0.08] px-3 py-1.5 text-xs">
                <span className={`font-bold ${ep.method === "GET" ? "text-emerald-400" : "text-amber-400"}`}>{ep.method}</span>
                <span className="font-mono text-slate-400">{ep.path}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Authentication ── */}
        <section className="space-y-6">
          <SectionHeading
            id="authentication"
            badge="01 · Auth"
            title="Authentication"
            description="All requests require a Bearer token in the Authorization header. Generate keys from the API Keys page in your dashboard."
          />
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            <TerminalHeader method="GET" path="/api/v1/score" label="Request" />
            <pre className="bg-zinc-900 text-zinc-200 p-5 text-xs leading-relaxed overflow-x-auto font-mono">
{`curl https://intentiq.com/api/v1/score \\
  -G -d domain=stripe.com \\
  -H "Authorization: Bearer iq_live_sk_••••••••••••••••"

# Key format:  iq_live_sk_<32 hex chars>
# Key scope:   read — all GET endpoints
#              write — GET + bulk + watchlist mutations`}
            </pre>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Header",    val: "Authorization" },
              { label: "Scheme",    val: "Bearer"        },
              { label: "Key prefix",val: "iq_live_sk_"   },
              { label: "Revoke",    val: "Dashboard → API Keys" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl glass border border-white/[0.08] p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{item.label}</p>
                <p className="text-sm font-mono font-medium text-slate-200">{item.val}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Score a Domain ── */}
        <section className="space-y-6">
          <SectionHeading
            id="score"
            badge="02 · Core"
            title="Score a Domain"
            description="Returns a composite 0–100 intent score for any company domain, with signal breakdown and AI-generated reasoning."
          />

          {/* Parameters */}
          <div className="rounded-2xl glass border border-white/[0.08] overflow-hidden">
            <div className="bg-white/[0.04] border-b border-white/[0.06] px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Query Parameters</p>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  { param: "domain",               req: true,  type: "string",  desc: "Company domain to score (e.g. stripe.com)" },
                  { param: "include_signals",       req: false, type: "boolean", desc: "Include per-signal breakdown in response. Default: true" },
                  { param: "include_talk_track",    req: false, type: "boolean", desc: "Include AI-generated talk track. Default: false" },
                  { param: "include_email_subject", req: false, type: "boolean", desc: "Include suggested email subject line. Default: false" },
                ].map((row) => (
                  <tr key={row.param} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3 w-48">
                      <code className="text-xs font-mono text-cyan-400">{row.param}</code>
                      {row.req && <span className="ml-2 text-[10px] font-bold text-red-500 uppercase">required</span>}
                    </td>
                    <td className="px-5 py-3 w-20">
                      <span className="text-xs font-mono text-amber-400">{row.type}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Request / Response panels */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <TerminalHeader method="GET" path="/api/v1/score" label="Request" />
              <pre className="bg-zinc-900 text-zinc-200 p-5 text-xs leading-relaxed overflow-x-auto font-mono">
{`curl https://intentiq.com/api/v1/score \\
  -G \\
  -d domain=stripe.com \\
  -d include_signals=true \\
  -d include_talk_track=true \\
  -H "Authorization: Bearer iq_live_sk_••••"

# JavaScript
const res = await fetch(
  '/api/v1/score?domain=stripe.com',
  { headers: { Authorization: 'Bearer iq_live_sk_••••' } }
);
const data = await res.json();

# Python
import requests
data = requests.get(
  'https://intentiq.com/api/v1/score',
  params={'domain': 'stripe.com'},
  headers={'Authorization': 'Bearer iq_live_sk_••••'}
).json()`}
              </pre>
              <div className="bg-zinc-950 border-t border-white/5 px-5 py-3 flex items-center gap-6">
                {[
                  { label: "Method",  val: "GET"          },
                  { label: "Credits", val: "1 per call"   },
                  { label: "Cache",   val: "24h TTL"      },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</p>
                    <p className="text-xs text-zinc-300 font-mono">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <TerminalHeader status="200" path="OK · 1.24s" label="Response" />
              <div className="bg-zinc-900 p-5 text-xs leading-relaxed overflow-x-auto font-mono">
                <div className="text-zinc-500">{"{"}</div>
                <J k="company"            v="Stripe, Inc."           />
                <J k="domain"             v="stripe.com"             />
                <J k="intent_score"       v={91}                     />
                <J k="score_band"         v="HOT"                    />
                <J k="buying_stage"       v="active-evaluation"      />
                <J k="urgency"            v="act-now"                />
                <J k="ai_summary"         v="Raised $600M 3 weeks ago, hiring aggressively..." />
                <J k="why_now"            v="Series I closed 21 days ago. Hiring +40% MoM." />
                <div className="text-zinc-400">{"  "}<span className="text-cyan-300/70">&quot;key_triggers&quot;</span><span className="text-zinc-500">: [</span></div>
                <div className="text-emerald-400 pl-8">&quot;$600M Series I&quot;,</div>
                <div className="text-emerald-400 pl-8">&quot;47 open eng roles&quot;,</div>
                <div className="text-emerald-400 pl-8">&quot;Checkout SDK launch&quot;</div>
                <div className="text-zinc-500">{"  "},</div>
                <J k="recommended_action" v="Lead with ROI on conversion rates."  />
                <J k="email_subject"      v="Quick question about Stripe's infra scale" />
                <div className="text-zinc-400">{"  "}<span className="text-cyan-300/70">&quot;signals&quot;</span><span className="text-zinc-500">: {"{"}</span></div>
                <div className="text-zinc-500 pl-8">
                  <span className="text-cyan-300/70">&quot;funding&quot;</span>{" → "}<span className="text-amber-400">25</span>/25{"  "}
                  <span className="text-cyan-300/70">&quot;hiring&quot;</span>{" → "}<span className="text-amber-400">18</span>/20
                </div>
                <div className="text-zinc-500 pl-8">
                  <span className="text-cyan-300/70">&quot;news&quot;</span>{"    → "}<span className="text-amber-400">16</span>/20{"  "}
                  <span className="text-cyan-300/70">&quot;technology&quot;</span>{" → "}<span className="text-amber-400">17</span>/20
                </div>
                <div className="text-zinc-500 pl-8">
                  <span className="text-cyan-300/70">&quot;web&quot;</span>{"     → "}<span className="text-amber-400">15</span>/15
                </div>
                <div className="text-zinc-400">{"  "}<span className="text-zinc-500">{"}"}</span></div>
                <J k="score_decay_date"   v="2026-04-07T00:00:00.000Z" comma={false} />
                <div className="text-zinc-500">{"}"}</div>
              </div>
              <div className="bg-zinc-950 border-t border-white/5 px-5 py-3 flex items-center gap-6">
                {[
                  { label: "Score",   val: "91 / 100", cls: "text-zinc-300" },
                  { label: "Band",    val: "HOT",      cls: "text-emerald-400 font-bold" },
                  { label: "Latency", val: "~1.2s",    cls: "text-zinc-300" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</p>
                    <p className={`text-xs font-mono ${item.cls}`}>{item.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Bulk Scoring ── */}
        <section className="space-y-6">
          <SectionHeading
            id="bulk"
            badge="03 · Bulk"
            title="Bulk Scoring"
            description="Submit up to 1,000 domains at once. Credits are deducted upfront. Results are downloadable as CSV once the job completes."
          />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <TerminalHeader method="POST" path="/api/v1/score/bulk" label="Request" />
              <pre className="bg-zinc-900 text-zinc-200 p-5 text-xs leading-relaxed overflow-x-auto font-mono">
{`curl https://intentiq.com/api/v1/score/bulk \\
  -X POST \\
  -H "Authorization: Bearer iq_live_sk_••••" \\
  -F "file=@companies.csv"

# CSV format:
# company_name,domain
# Stripe,stripe.com
# Notion,notion.so
# Linear,linear.app

# Max: 1,000 rows per job
# Max concurrent jobs: 3`}
              </pre>
            </div>
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <TerminalHeader status="202" path="Accepted" label="Response" />
              <div className="bg-zinc-900 p-5 text-xs leading-relaxed overflow-x-auto font-mono">
                <div className="text-zinc-500">{"{"}</div>
                <J k="job_id"     v="bulk_01JMXPQ7"  />
                <J k="status"     v="queued"          />
                <J k="count"      v={3}               />
                <J k="credits_deducted" v={3}         />
                <J k="poll_url"   v="/api/v1/score/bulk/bulk_01JMXPQ7" comma={false} />
                <div className="text-zinc-500">{"}"}</div>
              </div>
              <div className="bg-zinc-950 border-t border-white/5 px-5 py-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Poll the <span className="font-mono text-zinc-400">poll_url</span> until <span className="font-mono text-emerald-400">status: &quot;done&quot;</span>, then download the result CSV.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Watchlist ── */}
        <section className="space-y-6">
          <SectionHeading
            id="watchlist"
            badge="04 · Watchlist"
            title="Watchlist"
            description="Monitor companies over time. Scores are refreshed periodically. HOT leads (≥75) surface to the top of your dashboard."
          />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <TerminalHeader method="POST" path="/api/v1/watchlist" label="Add to watchlist" />
              <pre className="bg-zinc-900 text-zinc-200 p-5 text-xs leading-relaxed overflow-x-auto font-mono">
{`curl https://intentiq.com/api/v1/watchlist \\
  -X POST \\
  -H "Authorization: Bearer iq_live_sk_••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "domain": "stripe.com",
    "company_name": "Stripe"
  }'`}
              </pre>
            </div>
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
              <TerminalHeader method="GET" path="/api/v1/watchlist" label="List watchlist" />
              <pre className="bg-zinc-900 text-zinc-200 p-5 text-xs leading-relaxed overflow-x-auto font-mono">
{`curl https://intentiq.com/api/v1/watchlist \\
  -H "Authorization: Bearer iq_live_sk_••••"

# Returns array sorted by score desc
# Filter by band:
  ?band=HOT
  ?band=WARM`}
              </pre>
            </div>
          </div>
        </section>

        {/* ── Error Codes ── */}
        <section className="space-y-6">
          <SectionHeading
            id="errors"
            badge="05 · Errors"
            title="Error Codes"
            description="All errors return a JSON body with an error field. HTTP status codes follow REST conventions."
          />
          <div className="rounded-2xl glass border border-white/[0.08] overflow-hidden">
            <div className="bg-white/[0.04] border-b border-white/[0.06] px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">HTTP Status Codes</p>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  { code: "400", color: "text-amber-400",  title: "Bad Request",       desc: "Missing or invalid domain parameter." },
                  { code: "401", color: "text-red-400",    title: "Unauthorized",      desc: "Missing, invalid, or revoked API key." },
                  { code: "402", color: "text-orange-400", title: "Payment Required",  desc: "Insufficient credits. Top up to continue." },
                  { code: "429", color: "text-violet-400", title: "Too Many Requests", desc: "Rate limit exceeded (60 req/min). Retry after 1 minute." },
                  { code: "500", color: "text-red-400",    title: "Server Error",      desc: "Unexpected error. Try again or contact support." },
                ].map((row) => (
                  <tr key={row.code} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3 w-20">
                      <code className={`text-sm font-bold font-mono ${row.color}`}>{row.code}</code>
                    </td>
                    <td className="px-5 py-3 w-40 font-medium text-sm text-slate-200">{row.title}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            <TerminalHeader status="402" path="Payment Required" label="Error response" />
            <div className="bg-zinc-900 p-5 text-xs leading-relaxed font-mono">
              <div className="text-zinc-500">{"{"}</div>
              <J k="error"   v="Insufficient credits. Please top up your account." />
              <J k="code"    v="insufficient_credits" comma={false} />
              <div className="text-zinc-500">{"}"}</div>
            </div>
          </div>
        </section>

        {/* ── Rate Limits ── */}
        <section className="space-y-6">
          <SectionHeading
            id="limits"
            badge="06 · Limits"
            title="Rate Limits"
            description="Limits apply per API key. Bulk jobs count as 1 request against the rate limit regardless of company count."
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Score requests",  val: "60 / min"         },
              { label: "Bulk jobs",       val: "3 concurrent"     },
              { label: "Bulk max rows",   val: "1,000 / job"      },
              { label: "Watchlist limit", val: "Plan-dependent"   },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl glass border border-white/[0.08] p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{item.label}</p>
                <p className="text-sm font-mono font-bold text-slate-100">{item.val}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl glass border border-cyan-500/20 bg-cyan-500/5 p-5 text-sm text-slate-400">
            Rate limit headers are returned on every response:
            <code className="block mt-2 font-mono text-xs text-cyan-300 bg-white/[0.06] rounded-lg px-3 py-2">
              X-RateLimit-Limit: 60{"\n"}
              X-RateLimit-Remaining: 58{"\n"}
              X-RateLimit-Reset: 1741392060
            </code>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl glass border border-white/[0.08] p-8 text-center space-y-4">
          <h3 className="text-2xl font-black text-slate-100">Ready to integrate?</h3>
          <p className="text-slate-400">Get your API key in 30 seconds. 20 free credits included.</p>
          <div className="flex gap-3 justify-center">
            <Button className="rounded-full bg-cyan-500 hover:bg-cyan-400 text-white border-0 px-8" asChild>
              <Link href="/signup">Get API key</Link>
            </Button>
            <Button variant="outline" className="rounded-full px-8 border-white/[0.12] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10 mt-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="font-black text-gradient">
            IntentIQ
          </span>
          <p className="text-sm text-slate-500">API v1 · © {new Date().getFullYear()} IntentIQ</p>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-200 transition-colors">
            ← Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
