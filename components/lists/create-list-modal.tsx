"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListRule, ListType } from "@/lib/lists-types";
import { LIST_COLORS } from "@/lib/lists-types";

interface CreateListModalProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_RULE: ListRule = { field: "score", op: ">=", value: 75 };

export function CreateListModal({ open, onClose }: CreateListModalProps) {
  const router = useRouter();
  const [listType, setListType] = useState<ListType>("smart");
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(LIST_COLORS[0].value);
  const [rules, setRules] = useState<ListRule[]>([{ ...DEFAULT_RULE }]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPreview = useCallback(async (r: ListRule[]) => {
    if (listType !== "smart") {
      setPreviewCount(null);
      return;
    }
    try {
      const res = await fetch("/api/dashboard/lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: r }),
      });
      const data = await res.json();
      setPreviewCount(data.count ?? 0);
    } catch {
      setPreviewCount(null);
    }
  }, [listType]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchPreview(rules), 300);
    return () => clearTimeout(t);
  }, [open, rules, fetchPreview]);

  function updateRule(index: number, patch: Partial<ListRule>) {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } as ListRule : r)));
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function addRule() {
    setRules((prev) => [...prev, { field: "score_band", op: "is", value: "HOT" }]);
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          list_type: listType,
          color,
          rules: listType === "smart" ? rules : undefined,
          auto_refresh: listType === "smart" ? autoRefresh : false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onClose();
      setName("");
      router.push(`/lists/${data.list.id}`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create list");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="lst-modal-mask open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lst-modal" role="dialog" aria-labelledby="create-list-title">

        {/* Header */}
        <div className="lst-modal-head">
          <div className="title" id="create-list-title">Create a new list</div>
          <button type="button" className="ld-icon-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="lst-modal-body">

          {/* List type */}
          <div className="lst-field-label">List type</div>
          <div className="mode-picker">
            <button
              type="button"
              className={`mode-card${listType === "smart" ? " active" : ""}`}
              onClick={() => setListType("smart")}
            >
              <div className="mi">
                <div className="ico">
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" width="10" height="10">
                    <path d="M5 1v2M1 5h2M5 9v-2M9 5h-2M2 2l1 1M8 2l-1 1M2 8l1-1M8 8l-1-1" />
                  </svg>
                </div>
                <div className="t">Smart list</div>
              </div>
              <div className="d">Builds itself from rules. Auto-refreshes as accounts qualify or drop out.</div>
            </button>
            <button
              type="button"
              className={`mode-card manual${listType === "manual" ? " active" : ""}`}
              onClick={() => setListType("manual")}
            >
              <div className="mi">
                <div className="ico">
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" width="10" height="10">
                    <rect x="1.5" y="1.5" width="7" height="7" />
                  </svg>
                </div>
                <div className="t">Manual list</div>
              </div>
              <div className="d">Add accounts by hand. Membership only changes when you change it.</div>
            </button>
          </div>

          {/* Name */}
          <div className="lst-field">
            <label className="lst-field-label" htmlFor="list-name">Name</label>
            <input
              id="list-name"
              className="lst-field-input"
              type="text"
              placeholder="e.g. Q3 expansion targets"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Color */}
          <div className="lst-field">
            <label className="lst-field-label">Color</label>
            <div className="color-picker">
              {LIST_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`sw${color === c.value ? " active" : ""}`}
                  style={{ background: c.value }}
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          {/* Rules (smart only) */}
          {listType === "smart" && (
            <div className="lst-field">
              <label className="lst-field-label">Rules — accounts match all of</label>
              <div className="rule-builder">
                {rules.map((rule, i) => (
                  <div key={i}>
                    {i > 0 && <div className="rb-conj">AND</div>}
                    <div className="rb-row">
                      <select
                        className="rb-sel field"
                        value={rule.field}
                        onChange={(e) => {
                          const f = e.target.value;
                          if (f === "score") updateRule(i, { field: "score", op: ">=", value: 75 });
                          else if (f === "score_band") updateRule(i, { field: "score_band", op: "is", value: "HOT" });
                          else if (f === "in_watchlist") updateRule(i, { field: "in_watchlist", op: "is", value: true });
                          else updateRule(i, { field: "signal", signal: "hiring", op: "active", minStrength: 1 });
                        }}
                      >
                        <option value="score">Score</option>
                        <option value="score_band">Score band</option>
                        <option value="in_watchlist">In watchlist</option>
                        <option value="signal">Signal</option>
                      </select>

                      {rule.field === "score" && (
                        <>
                          <select
                            className="rb-sel op"
                            value={rule.op}
                            onChange={(e) => updateRule(i, { op: e.target.value as ">=" | "<=" | "=" })}
                          >
                            <option value=">=">≥</option>
                            <option value="<=">≤</option>
                            <option value="=">=</option>
                          </select>
                          <input
                            className="rb-sel"
                            type="number"
                            min={0}
                            max={100}
                            value={rule.value}
                            onChange={(e) => updateRule(i, { value: Number(e.target.value) })}
                          />
                        </>
                      )}
                      {rule.field === "score_band" && (
                        <>
                          <select className="rb-sel op" value="is" disabled><option>IS</option></select>
                          <select
                            className="rb-sel"
                            value={rule.value}
                            onChange={(e) => updateRule(i, { value: e.target.value as "HOT" | "WARM" | "COLD" })}
                          >
                            <option value="HOT">HOT</option>
                            <option value="WARM">WARM</option>
                            <option value="COLD">COLD</option>
                          </select>
                        </>
                      )}
                      {rule.field === "in_watchlist" && (
                        <>
                          <select className="rb-sel op" value="is" disabled><option>IS</option></select>
                          <select
                            className="rb-sel"
                            value={rule.value ? "yes" : "no"}
                            onChange={(e) => updateRule(i, { value: e.target.value === "yes" })}
                          >
                            <option value="yes">yes</option>
                            <option value="no">no</option>
                          </select>
                        </>
                      )}
                      {rule.field === "signal" && (
                        <>
                          <select className="rb-sel op" value="active" disabled><option>ACTIVE</option></select>
                          <select
                            className="rb-sel"
                            value={rule.signal}
                            onChange={(e) =>
                              updateRule(i, {
                                field: "signal",
                                signal: e.target.value as "funding" | "hiring" | "news" | "technology" | "web",
                                op: "active",
                                minStrength: 1,
                              })
                            }
                          >
                            <option value="funding">Funding</option>
                            <option value="hiring">Hiring</option>
                            <option value="news">News</option>
                            <option value="technology">Technology</option>
                            <option value="web">Web</option>
                          </select>
                        </>
                      )}

                      <button
                        type="button"
                        className="rm"
                        onClick={() => removeRule(i)}
                        aria-label="Remove rule"
                      >
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="10" height="10">
                          <path d="M3 3l6 6M9 3l-6 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="rb-add" onClick={addRule}>
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" width="9" height="9">
                    <path d="M5 2v6M2 5h6" />
                  </svg>
                  Add rule
                </button>
              </div>
            </div>
          )}

          {/* Auto-refresh (smart only) */}
          {listType === "smart" && (
            <div className="lst-autorefresh">
              <div className="lst-autorefresh-info">
                <div className="lst-autorefresh-title">Auto-refresh</div>
                <div className="lst-autorefresh-sub">Re-evaluate every 6 hours and notify on changes.</div>
              </div>
              <button
                type="button"
                className={`lst-toggle${autoRefresh ? " on" : ""}`}
                onClick={() => setAutoRefresh((v) => !v)}
                aria-label={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
              >
                <span className="lst-toggle-thumb" />
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="lst-modal-foot">
          {listType === "smart" && previewCount != null && (
            <div className="preview-count">
              Matches <strong>{previewCount}</strong> accounts right now
            </div>
          )}
          <button type="button" className="tb-btn outlined" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? "Creating…" : "Create list"}
          </button>
        </div>

      </div>
    </div>
  );
}
