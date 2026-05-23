import type { SignalSet } from "@/lib/types";
import type { AccountContext, ListRule } from "@/lib/lists-types";

function signalStrength(signals: SignalSet | null, key: keyof Omit<SignalSet, "latestSignalDate">): number {
  if (!signals) return 0;
  const s = signals[key];
  if (!s || typeof s !== "object" || !("score" in s)) return 0;
  return s.score ?? 0;
}

export function evaluateRule(rule: ListRule, ctx: AccountContext): boolean {
  switch (rule.field) {
    case "score": {
      if (ctx.score == null) return false;
      if (rule.op === ">=") return ctx.score >= rule.value;
      if (rule.op === "<=") return ctx.score <= rule.value;
      return ctx.score === rule.value;
    }
    case "score_band":
      return ctx.score_band === rule.value;
    case "in_watchlist":
      return ctx.inWatchlist === rule.value;
    case "signal": {
      const strength = signalStrength(ctx.signals, rule.signal);
      const min = rule.minStrength ?? 1;
      return strength >= min;
    }
    default:
      return false;
  }
}

export function evaluateRules(rules: ListRule[] | null | undefined, ctx: AccountContext): boolean {
  if (!rules || rules.length === 0) return true;
  return rules.every((rule) => evaluateRule(rule, ctx));
}

export function filterAccountsByRules(
  accounts: AccountContext[],
  rules: ListRule[] | null | undefined,
): AccountContext[] {
  return accounts.filter((ctx) => evaluateRules(rules, ctx));
}

export function ruleToDisplayParts(rule: ListRule): { field: string; op: string; val: string } {
  switch (rule.field) {
    case "score":
      return { field: "Score", op: rule.op, val: String(rule.value) };
    case "score_band":
      return { field: "Score band", op: "is", val: rule.value };
    case "in_watchlist":
      return { field: "In watchlist", op: "is", val: rule.value ? "yes" : "no" };
    case "signal":
      return {
        field: `${rule.signal} signal`,
        op: "active",
        val: rule.minStrength != null ? `strength ≥ ${rule.minStrength}` : "active",
      };
    default:
      return { field: "Rule", op: "is", val: "" };
  }
}
