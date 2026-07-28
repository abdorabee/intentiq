const KNOWN_ADAPTERS = new Set(["company", "greenhouse", "lever", "ashby", "workable"]);

export function parsePromotedAdapters(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((adapter) => adapter.trim().toLowerCase())
      .filter((adapter) => KNOWN_ADAPTERS.has(adapter))
  );
}

/**
 * Promotion is deliberately two-keyed: the global shadow switch must be off,
 * and every adapter represented in this observation must have been approved
 * individually. Unknown or mixed unapproved adapters keep the whole row in
 * shadow mode so they cannot affect scoring accidentally.
 */
export function shouldPromoteEvidence({ requestedShadow, adapters, allowlist }) {
  if (requestedShadow || !Array.isArray(adapters) || adapters.length === 0) return false;
  const promoted = parsePromotedAdapters(allowlist);
  return adapters.every(
    (adapter) => typeof adapter === "string" && promoted.has(adapter.toLowerCase())
  );
}
