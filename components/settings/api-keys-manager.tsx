"use client";

import { Check, Clipboard, KeyRound, Loader2, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiKeyLabelSchema, type PublicApiKeyRecord } from "@/lib/api-keys";

interface ApiKeysPayload {
  keys: PublicApiKeyRecord[];
  limit: number;
  plan: string;
}

async function responseError(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  return payload?.error ?? fallback;
}

export function ApiKeysManager() {
  const [payload, setPayload] = useState<ApiKeysPayload | null>(null);
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<PublicApiKeyRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const revokeTrigger = useRef<HTMLButtonElement | null>(null);
  const cancelRevokeButton = useRef<HTMLButtonElement | null>(null);
  const confirmRevokeButton = useRef<HTMLButtonElement | null>(null);
  const revokeStatus = useRef<HTMLParagraphElement | null>(null);
  const keysHeading = useRef<HTMLHeadingElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/api-keys", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response, "Failed to load API keys"));
      setPayload(await response.json() as ApiKeysPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createKey(event: React.FormEvent) {
    event.preventDefault();
    const parsed = apiKeyLabelSchema.safeParse(label);
    if (!parsed.success) {
      setError("Label must be between 1 and 48 characters");
      return;
    }

    setCreating(true);
    setError(null);
    setSecret(null);
    setCopied(false);
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: parsed.data }),
      });
      if (!response.ok) throw new Error(await responseError(response, "Failed to create API key"));
      const created = await response.json() as { key: string; record: PublicApiKeyRecord };
      setPayload((current) => current ? { ...current, keys: [created.record, ...current.keys] } : current);
      setSecret(created.key);
      setCopied(false);
      setLabel("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setError("Copy failed. Select the key and copy it manually.");
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    setError(null);
    try {
      const response = await fetch(`/api/user/api-keys?id=${encodeURIComponent(revokeTarget.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response, "Failed to revoke API key"));
      const result = await response.json() as { record: PublicApiKeyRecord };
      setPayload((current) => current ? {
        ...current,
        keys: current.keys.map((key) => key.id === result.record.id ? { ...key, is_active: false } : key),
      } : current);
      closeRevokeDialog(true);
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Failed to revoke API key");
    } finally {
      setRevoking(false);
    }
  }

  function closeRevokeDialog(succeeded = false) {
    setRevokeTarget(null);
    queueMicrotask(() => (succeeded ? keysHeading.current : revokeTrigger.current)?.focus());
  }

  useEffect(() => {
    if (revokeTarget && !revoking) cancelRevokeButton.current?.focus();
  }, [revokeTarget, revoking]);

  useEffect(() => {
    if (revoking) revokeStatus.current?.focus();
  }, [revoking]);

  if (loading) {
    return <div role="status" className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Loading API keys…</div>;
  }

  if (!payload) {
    return (
      <div className="border border-red-500/30 bg-red-500/5 p-5">
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error ?? "Failed to load API keys"}</p>
        <button type="button" onClick={() => void load()} className="mt-3 inline-flex items-center gap-2 border border-red-500/30 px-3 py-2 text-sm"><RotateCcw className="h-4 w-4" aria-hidden />Retry</button>
      </div>
    );
  }

  const activeCount = payload.keys.filter((key) => key.is_active).length;
  const atLimit = activeCount >= payload.limit;

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {secret && (
        <section aria-labelledby="new-key-heading" className="border border-amber-500/40 bg-amber-500/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="new-key-heading" className="text-sm font-semibold text-slate-950 dark:text-white">Your new API key</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">This secret is shown once. Copy it now and store it in a secure password manager.</p>
            </div>
            <button type="button" onClick={() => setSecret(null)} aria-label="Close new key" className="p-1 text-slate-500"><X className="h-4 w-4" aria-hidden /></button>
          </div>
          <code className="mt-4 block overflow-x-auto border border-amber-500/30 bg-black/5 p-3 text-xs text-slate-900 dark:bg-black/30 dark:text-white">{secret}</code>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void copySecret()} className="inline-flex items-center gap-2 bg-slate-950 px-3 py-2 text-xs font-medium text-white dark:bg-white dark:text-black">
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Clipboard className="h-4 w-4" aria-hidden />}
              {copied ? "Copied" : "Copy key"}
            </button>
            <button type="button" onClick={() => setSecret(null)} className="border border-slate-300 px-3 py-2 text-xs dark:border-white/20">I saved this key</button>
          </div>
        </section>
      )}

      <section className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Create a key</h2>
            <p className="mt-1 text-xs text-slate-500"><span className="capitalize">{payload.plan}</span> plan · <span>{activeCount} of {payload.limit} active keys</span></p>
          </div>
          <form onSubmit={createKey} className="flex w-full gap-2 sm:max-w-md">
            <div className="min-w-0 flex-1">
              <label htmlFor="api-key-label" className="sr-only">Key label</label>
              <input id="api-key-label" aria-label="Key label" value={label} maxLength={48} onChange={(event) => setLabel(event.target.value)} placeholder="Production integration" disabled={creating || atLimit} className="h-10 w-full border border-slate-300 bg-transparent px-3 text-sm outline-none focus:border-cyan-500 dark:border-white/20" />
            </div>
            <button type="submit" disabled={creating || atLimit} className="inline-flex h-10 items-center gap-2 bg-slate-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
              Create API key
            </button>
          </form>
        </div>
        {atLimit && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Revoke an active key before creating another on this plan.</p>}
      </section>

      <section aria-labelledby="keys-heading" className="border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <h2 ref={keysHeading} tabIndex={-1} id="keys-heading" className="border-b border-slate-200 px-5 py-4 text-sm font-semibold outline-none dark:border-white/10">API keys</h2>
        {payload.keys.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No API keys yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {payload.keys.map((key) => (
              <li key={key.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-950 dark:text-white">{key.label}</p>
                  <p className="mt-1 text-xs text-slate-500">Created {new Date(key.created_at).toLocaleDateString()} · {key.last_used ? `Last used ${new Date(key.last_used).toLocaleDateString()}` : "Never used"}</p>
                </div>
                {key.is_active ? (
                  <button type="button" aria-label={`Revoke ${key.label}`} onClick={(event) => { revokeTrigger.current = event.currentTarget; setRevokeTarget(key); }} className="border border-red-500/30 px-3 py-2 text-xs text-red-600 hover:bg-red-500/5 dark:text-red-400">Revoke</button>
                ) : <span className="text-xs text-slate-500">Revoked</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {revokeTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="revoke-title" className="w-full max-w-md border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950" onKeyDown={(event) => {
            if (event.key === "Escape" && !revoking) { event.preventDefault(); closeRevokeDialog(); }
            if (event.key === "Tab") {
              if (revoking) { event.preventDefault(); revokeStatus.current?.focus(); return; }
              if (event.shiftKey && document.activeElement === cancelRevokeButton.current) { event.preventDefault(); confirmRevokeButton.current?.focus(); }
              else if (!event.shiftKey && document.activeElement === confirmRevokeButton.current) { event.preventDefault(); cancelRevokeButton.current?.focus(); }
            }
          }}>
            <h2 id="revoke-title" className="text-base font-semibold">Revoke API key</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Requests using <strong>{revokeTarget.label}</strong> will stop authenticating immediately. This cannot be undone.</p>
            {revoking && <p ref={revokeStatus} tabIndex={-1} role="status" aria-label="Revocation in progress" className="mt-3 text-sm text-slate-600 outline-none dark:text-slate-300">Revoking API key…</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button ref={cancelRevokeButton} type="button" disabled={revoking} onClick={() => closeRevokeDialog()} className="border border-slate-300 px-3 py-2 text-sm dark:border-white/20">Cancel</button>
              <button ref={confirmRevokeButton} type="button" disabled={revoking} onClick={() => void confirmRevoke()} className="inline-flex items-center gap-2 bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                {revoking && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Confirm revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
