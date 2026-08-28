"use client";

import { Component, useMemo, useState, type ReactNode } from "react";
import type { ConfirmationBlock, UiBlock, UiBlockType, UiSuggestion, SignalAxis } from "@/lib/gen-ui";
import { UI_BLOCK_REGISTRY } from "@/lib/gen-ui";
import { avColor, bandClass, ScoreRing } from "@/components/score/score-result-card";

export interface GenUiHandlers {
  onWatchlist?: (company: string, domain: string) => void;
  watchlistByDomain?: Record<string, "adding" | "added">;
  onPrompt?: (prompt: string) => void;
  onConfirm?: (block: ConfirmationBlock) => void;
  onCancel?: (block: ConfirmationBlock) => void;
  confirmationByKey?: Record<string, "pending" | "confirming" | "confirmed" | "cancelled" | "error">;
}

class BlockGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <p className="chat-fallback">This view could not be rendered.</p>;
    }
    return this.props.children;
  }
}

function BlockLoading() {
  return (
    <div className="chat-thinking">
      <span className="pulse" />
      Working…
    </div>
  );
}

const AXIS_COLOR: Record<string, string> = {
  funding: "#dfff00",
  hiring: "#4ade80",
  news: "#f5b544",
  technology: "#e8ff40",
  web: "#8a8f98",
  github: "#a78bfa",
};

const AXIS_GRAD: Record<string, string> = {
  funding: "linear-gradient(90deg,#dfff00,#e8ff40)",
  hiring: "linear-gradient(90deg,#4ade80,#22c55e)",
  news: "linear-gradient(90deg,#f5b544,#d49530)",
  technology: "linear-gradient(90deg,#e8ff40,#dfff00)",
};

function IntentHero({ block }: { block: Extract<UiBlock, { type: "intent_hero" }> }) {
  return (
    <div className="overview-block gen-hero">
      <ScoreRing score={block.intent_score} band={block.score_band} />
      <div className="gen-hero-copy">
        <div className="result-title-row">
          <div className="result-avatar" style={{ background: avColor(block.company), width: 36, height: 36, fontSize: 14 }}>
            {block.company[0]}
          </div>
          <span className={`band ${bandClass(block.score_band)}`}>
            <span className="dot" />{block.score_band}
          </span>
          <span className="result-title">{block.company}</span>
        </div>
        <div className="result-meta">
          <span style={{ color: "var(--text-secondary)" }}>{block.domain}</span>
          {block.buying_stage && (<><span className="dot" /><span>{block.buying_stage}</span></>)}
          {block.urgency && (<><span className="dot" /><span>Urgency: {block.urgency}</span></>)}
          {block.data_coverage != null && (
            <>
              <span className="dot" />
              <span>Coverage: {Math.round(block.data_coverage * 100)}%{block.score_status ? ` (${block.score_status})` : ""}</span>
            </>
          )}
          {block.icp_fit_score !== undefined && (
            <>
              <span className="dot" />
              <span>{block.icp_fit_score == null ? "ICP fit unavailable" : `ICP fit: ${block.icp_fit_score}%`}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SignalExplorer({ block }: { block: Extract<UiBlock, { type: "signal_explorer" }> }) {
  const triggers = block.axes.filter((a) => !a.context);
  const context = block.axes.filter((a) => a.context);
  const [selected, setSelected] = useState<string>(block.selected_key ?? triggers[0]?.key ?? block.axes[0]?.key);
  const active = block.axes.find((a) => a.key === selected) ?? block.axes[0];

  function AxisCard({ axis }: { axis: SignalAxis }) {
    const pct = Math.round((axis.score / axis.max) * 100);
    const isOn = axis.key === selected;
    return (
      <button
        type="button"
        className={`signal-card gen-axis ${isOn ? "is-selected" : ""}`}
        onClick={() => setSelected(axis.key)}
        aria-pressed={isOn}
      >
        <div className="name">
          <span className="swatch" style={{ background: AXIS_COLOR[axis.key] ?? "#8a8f98" }} />
          {axis.label}
        </div>
        <div className="num">{axis.score}</div>
        <div className="delta" style={{ color: "var(--text-tertiary)" }}>/{axis.max}{axis.context ? " · context" : ""}</div>
        <div className="bar">
          <div className="fill" style={{ width: `${pct}%`, background: AXIS_GRAD[axis.key] ?? AXIS_COLOR[axis.key] ?? "#8a8f98" }} />
        </div>
      </button>
    );
  }

  return (
    <div className="gen-explorer">
      <div className="section-label">
        <span className="ic" />
        <strong>Signal explorer</strong>
        <span style={{ color: "var(--text-tertiary)" }}>· click an axis for evidence</span>
        <span className="line" />
      </div>
      <div className="signal-grid">
        {triggers.map((axis) => <AxisCard key={axis.key} axis={axis} />)}
      </div>
      {context.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 20 }}>
            <span className="ic" style={{ background: "var(--text-tertiary)", boxShadow: "none" }} />
            <strong>Account context</strong>
            <span style={{ color: "var(--text-tertiary)" }}>· excluded from score</span>
            <span className="line" />
          </div>
          <div className="signal-grid">
            {context.map((axis) => <AxisCard key={axis.key} axis={axis} />)}
          </div>
        </>
      )}
      {active && (
        <div className="gen-evidence">
          <div className="gen-evidence-kicker">{active.label} evidence</div>
          <p>{active.detail || "No detail available for this axis."}</p>
          <div className="gen-evidence-meta">
            {active.source && <span>Source: {active.source}</span>}
            {active.observed_at && <span>Observed {active.observed_at.slice(0, 10)}</span>}
            <span>{active.score}/{active.max}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Thesis({ block }: { block: Extract<UiBlock, { type: "thesis" }> }) {
  return (
    <div className="thesis-block">
      <div className="thesis-head">
        <span className="ic" />
        AI thesis
      </div>
      <div className="thesis-text">{block.summary}</div>
      {(block.recommended_action || block.why_now) && (
        <div className="ca-verdict" style={{ marginTop: 14 }}>
          <div className="ai-dot" />
          <div className="text">
            <span className="label">AI verdict</span>
            {block.recommended_action && <strong>{block.recommended_action} </strong>}
            {block.why_now}
          </div>
        </div>
      )}
      {block.urgency && (
        <div className="thesis-meta">
          <span>Urgency: {block.urgency}</span>
        </div>
      )}
    </div>
  );
}

function OutreachStudio({ block, onPrompt }: { block: Extract<UiBlock, { type: "outreach_studio" }>; onPrompt?: (prompt: string) => void }) {
  const [subject, setSubject] = useState(block.subject ?? "");
  const [body, setBody] = useState(block.talk_track ?? "");
  const [copied, setCopied] = useState(false);

  function copy() {
    const text = [subject, body].filter(Boolean).join("\n\n");
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="gen-outreach">
      <div className="section-label">
        <span className="ic" style={{ background: "var(--brand)", boxShadow: "0 0 6px var(--brand-glow)" }} />
        <strong>Outreach studio</strong>
        <span style={{ color: "var(--text-tertiary)" }}>· edit, copy, or refine in chat</span>
        <span className="line" />
      </div>
      <label className="gen-field">
        <span>Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label className="gen-field">
        <span>Talk track</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
      </label>
      <div className="gen-outreach-actions">
        <button type="button" className="tb-btn outlined" onClick={copy} disabled={!subject && !body}>
          {copied ? "Copied!" : "Copy"}
        </button>
        {onPrompt && (
          <button
            type="button"
            className="tb-btn outlined"
            onClick={() => onPrompt("Rewrite this outreach to be shorter and more specific to the strongest trigger.")}
          >
            Refine in chat
          </button>
        )}
      </div>
    </div>
  );
}

function ActionRail({
  block,
  handlers,
}: {
  block: Extract<UiBlock, { type: "action_rail" }>;
  handlers: GenUiHandlers;
}) {
  return (
    <div className="gen-rail">
      <div className="result-actions">
        {handlers.onWatchlist && (
          <button
            type="button"
            className="tb-btn outlined"
            onClick={() => handlers.onWatchlist?.(block.company, block.domain)}
            disabled={handlers.watchlistByDomain?.[block.domain] === "adding" || handlers.watchlistByDomain?.[block.domain] === "added"}
          >
            {handlers.watchlistByDomain?.[block.domain] === "added"
              ? "Watching ✓"
              : handlers.watchlistByDomain?.[block.domain] === "adding"
                ? "Adding…"
                : "Save to list"}
          </button>
        )}
        <a
          className="tb-btn outlined"
          href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(block.company)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open account →
        </a>
      </div>
    </div>
  );
}

function ResultList({
  block,
  onPrompt,
}: {
  block: Extract<UiBlock, { type: "result_list" }>;
  onPrompt?: (prompt: string) => void;
}) {
  if (block.items.length === 0) {
    return <p className="chat-md">{block.empty_message ?? "No matching accounts."}</p>;
  }
  return (
    <div className="gen-list">
      <div className="section-label">
        <strong>Accounts</strong>
        {block.query && <span style={{ color: "var(--text-tertiary)" }}>· {block.query}</span>}
        <span className="line" />
      </div>
      {block.items.map((item) => (
        <button
          key={item.domain}
          type="button"
          className="gen-list-row"
          onClick={() => onPrompt?.(item.domain)}
        >
          <span className={`band ${bandClass(item.score_band ?? "COLD")}`}>
            <span className="dot" />{item.score_band ?? "—"}
          </span>
          <strong>{item.company}</strong>
          <span>{item.domain}</span>
          <span className="gen-list-score">{item.intent_score ?? "—"}</span>
        </button>
      ))}
    </div>
  );
}

function PipelineSummary({ block }: { block: Extract<UiBlock, { type: "pipeline_summary" }> }) {
  if (block.total === 0) {
    return <p className="chat-md">{block.empty_message ?? "No companies in pipeline."}</p>;
  }
  return (
    <div className="gen-pipeline">
      <div className="section-label">
        <strong>Pipeline</strong>
        <span style={{ color: "var(--text-tertiary)" }}>{block.total} accounts</span>
        <span className="line" />
      </div>
      {block.stages.map((stage) => (
        <div key={stage.stage} className="gen-pipeline-stage">
          <div className="gen-pipeline-head">{stage.stage} · {stage.count}</div>
          {stage.companies.map((company) => (
            <div key={company.domain} className="gen-list-row">
              <strong>{company.company}</strong>
              <span>{company.domain}</span>
              <span className="gen-list-score">{company.score ?? "—"}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PersonCard({ block }: { block: Extract<UiBlock, { type: "person_card" }> }) {
  return (
    <div className="gen-person">
      <div className="result-title-row">
        <span className={`band ${bandClass(block.score_band)}`}>
          <span className="dot" />{block.score_band}
        </span>
        <span className="result-title">{block.name}</span>
        <span className="gen-list-score">{block.intent_score}</span>
      </div>
      <div className="result-meta">
        {block.title && <span>{block.title}</span>}
        {block.company && (
          <>
            {block.title && <span className="dot" />}
            <span>{block.company}</span>
          </>
        )}
        {block.urgency && (
          <>
            <span className="dot" />
            <span>Urgency: {block.urgency}</span>
          </>
        )}
      </div>
      {block.summary && <p className="chat-md">{block.summary}</p>}
      {block.recommended_action && <p className="chat-md">{block.recommended_action}</p>}
      {block.approach_angle && <p className="chat-md">{block.approach_angle}</p>}
    </div>
  );
}

function confirmationKey(block: ConfirmationBlock): string {
  return `${block.action}:${block.domain}:${block.stage ?? ""}`;
}

function Confirmation({
  block,
  handlers,
}: {
  block: ConfirmationBlock;
  handlers: GenUiHandlers;
}) {
  const status = handlers.confirmationByKey?.[confirmationKey(block)] ?? block.status ?? "pending";
  if (status === "confirmed") {
    return <p className="gen-confirm is-done">Confirmed — {block.title}</p>;
  }
  if (status === "cancelled") {
    return <p className="gen-confirm is-done">Cancelled</p>;
  }
  return (
    <div className="gen-confirm">
      <strong>{block.title}</strong>
      <p>{block.description}</p>
      {status === "error" && <p className="chat-error" role="alert">Could not complete this change.</p>}
      <div className="gen-confirm-actions">
        <button
          type="button"
          className="tb-btn outlined"
          disabled={status === "confirming"}
          onClick={() => handlers.onConfirm?.(block)}
        >
          {status === "confirming" ? "Working…" : (block.confirm_label ?? "Confirm")}
        </button>
        <button
          type="button"
          className="tb-btn outlined"
          disabled={status === "confirming"}
          onClick={() => handlers.onCancel?.(block)}
        >
          {block.cancel_label ?? "Cancel"}
        </button>
      </div>
    </div>
  );
}

function Comparison({ block }: { block: Extract<UiBlock, { type: "comparison" }> }) {
  const keys = useMemo(() => {
    const set = new Set<string>();
    for (const account of block.accounts) {
      for (const axis of account.axes ?? []) set.add(axis.key);
    }
    return [...set];
  }, [block.accounts]);

  return (
    <div className="gen-compare">
      <div className="section-label">
        <span className="ic" />
        <strong>Comparison</strong>
        <span className="line" />
      </div>
      <div className="gen-compare-grid" style={{ gridTemplateColumns: `120px repeat(${block.accounts.length}, 1fr)` }}>
        <div />
        {block.accounts.map((account) => (
          <div key={account.domain} className="gen-compare-head">
            <span className={`band ${bandClass(account.score_band)}`}><span className="dot" />{account.score_band}</span>
            <strong>{account.company}</strong>
            <span className="gen-compare-score">{account.intent_score}</span>
          </div>
        ))}
        {keys.map((key) => (
          <div key={key} className="gen-compare-row">
            <span className="gen-compare-key">{key}</span>
            {block.accounts.map((account) => {
              const axis = account.axes?.find((a) => a.key === key);
              return (
                <span key={account.domain}>{axis ? `${axis.score}/${axis.max}` : "—"}</span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuggestionChips({
  suggestions,
  onPrompt,
  disabled,
}: {
  suggestions: UiSuggestion[];
  onPrompt?: (prompt: string) => void;
  disabled?: boolean;
}) {
  if (!suggestions.length || !onPrompt) return null;
  return (
    <div className="gen-chips">
      {suggestions.map((s) => (
        <button
          key={s.label}
          type="button"
          className="sugg"
          disabled={disabled}
          title={s.prompt}
          onClick={() => onPrompt(s.prompt)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

type RenderEntry<T extends UiBlock = UiBlock> = {
  type: T["type"];
  schema: (typeof UI_BLOCK_REGISTRY)[T["type"]]["schema"];
  render: (props: { block: T; handlers: GenUiHandlers }) => ReactNode;
  loading?: () => ReactNode;
};

export const UI_RENDER_REGISTRY: { [K in UiBlockType]: RenderEntry<Extract<UiBlock, { type: K }>> } = {
  intent_hero: { ...UI_BLOCK_REGISTRY.intent_hero, render: ({ block }) => <IntentHero block={block} />, loading: BlockLoading },
  signal_explorer: { ...UI_BLOCK_REGISTRY.signal_explorer, render: ({ block }) => <SignalExplorer block={block} />, loading: BlockLoading },
  thesis: { ...UI_BLOCK_REGISTRY.thesis, render: ({ block }) => <Thesis block={block} />, loading: BlockLoading },
  outreach_studio: { ...UI_BLOCK_REGISTRY.outreach_studio, render: ({ block, handlers }) => <OutreachStudio block={block} onPrompt={handlers.onPrompt} />, loading: BlockLoading },
  action_rail: { ...UI_BLOCK_REGISTRY.action_rail, render: ({ block, handlers }) => <ActionRail block={block} handlers={handlers} />, loading: BlockLoading },
  comparison: { ...UI_BLOCK_REGISTRY.comparison, render: ({ block }) => <Comparison block={block} />, loading: BlockLoading },
  markdown: { ...UI_BLOCK_REGISTRY.markdown, render: ({ block }) => <div className="chat-md">{block.text}</div>, loading: BlockLoading },
  result_list: { ...UI_BLOCK_REGISTRY.result_list, render: ({ block, handlers }) => <ResultList block={block} onPrompt={handlers.onPrompt} />, loading: BlockLoading },
  pipeline_summary: { ...UI_BLOCK_REGISTRY.pipeline_summary, render: ({ block }) => <PipelineSummary block={block} />, loading: BlockLoading },
  person_card: { ...UI_BLOCK_REGISTRY.person_card, render: ({ block }) => <PersonCard block={block} />, loading: BlockLoading },
  confirmation: { ...UI_BLOCK_REGISTRY.confirmation, render: ({ block, handlers }) => <Confirmation block={block} handlers={handlers} />, loading: BlockLoading },
};

function renderBlock(block: UiBlock, handlers: GenUiHandlers): ReactNode {
  const entry = UI_RENDER_REGISTRY[block.type] as RenderEntry | undefined;
  if (!entry?.render) {
    return <p className="chat-fallback">This view could not be rendered.</p>;
  }
  return entry.render({ block, handlers });
}

export function confirmationKeyFor(block: ConfirmationBlock): string {
  return confirmationKey(block);
}

export function GenUiWorkspace({ blocks, handlers }: { blocks: UiBlock[]; handlers: GenUiHandlers }) {
  return (
    <div className="gen-workspace">
      {blocks.map((block, i) => (
        <BlockGuard key={`${block.type}-${i}`}>
          {renderBlock(block, handlers)}
        </BlockGuard>
      ))}
    </div>
  );
}
