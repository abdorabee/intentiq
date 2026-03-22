"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Key } from "lucide-react";

interface ApiKey {
  id: string;
  label: string;
  last_used: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/user/api-keys").then((r) => r.json()).then((d) => setKeys(d.keys ?? []));
  }, []);

  async function generateKey() {
    setGenerating(true);
    const res = await fetch("/api/user/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel || "Default" }),
    });
    const data = await res.json();
    setNewKey(data.key);
    setKeys((prev) => [data.record, ...prev]);
    setNewLabel("");
    setGenerating(false);
    setCopied(false);
  }

  async function revokeKey(id: string) {
    await fetch(`/api/user/api-keys?id=${id}`, { method: "DELETE" });
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: false } : k)));
  }

  function handleCopyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const curlSnippet = newKey
    ? `curl "https://intentiq.com/api/v1/score?domain=acme.com" \\\n  -H "Authorization: Bearer ${newKey}"`
    : `curl "https://intentiq.com/api/v1/score?domain=acme.com" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <span className="text-cyan-400 text-xs tracking-[0.25em] uppercase">[API KEYS]</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">Manage Keys</h1>
        <p className="text-slate-500 text-sm tracking-[0.05em] mt-1">Generate and manage keys for programmatic access.</p>
      </div>

      {/* Newly generated key reveal */}
      {newKey && (
        <Card className="border-emerald-500/30 overflow-hidden">
          <div className="h-px bg-gradient-to-r from-emerald-500 via-green-400 to-transparent" />
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center gap-2">
              <Key className="h-4 w-4" />
              New Key Generated — Copy Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 block bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] px-4 py-3 text-sm text-slate-600 dark:text-slate-300 break-all font-mono">
                {newKey}
              </code>
              <Button
                size="sm"
                onClick={handleCopyKey}
                className={`shrink-0 gap-1.5 cursor-pointer h-9 px-3 ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/[0.12] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12]"
                }`}
              >
                {copied ? <><Check className="h-3.5 w-3.5" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
              </Button>
            </div>
            <p className="text-xs text-slate-500">This key will not be shown again.</p>
          </CardContent>
        </Card>
      )}

      {/* Generate form */}
      <Card className="border-slate-200 dark:border-white/[0.08]">
        <CardHeader><CardTitle className="text-slate-800 dark:text-slate-100">Generate New Key</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Label (e.g. Production)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateKey()}
            className="bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50"
          />
          <Button
            onClick={generateKey}
            disabled={generating}
            className="bg-cyan-500 hover:bg-cyan-400 text-white border-0 cursor-pointer shrink-0"
          >
            {generating ? "Generating…" : "Generate"}
          </Button>
        </CardContent>
      </Card>

      {/* Keys list */}
      <Card className="border-slate-200 dark:border-white/[0.08]">
        <CardHeader><CardTitle className="text-slate-800 dark:text-slate-100">Your Keys</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {keys.length === 0 && (
            <p className="text-sm text-slate-500">No API keys yet.</p>
          )}
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors gap-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-700 dark:text-slate-200">{k.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Created: {new Date(k.created_at).toLocaleDateString()}
                  {" · "}
                  Last used: {k.last_used ? new Date(k.last_used).toLocaleDateString() : "Never"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={k.is_active
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-500/20 text-slate-500 border border-slate-500/30"
                }>
                  {k.is_active ? "Active" : "Revoked"}
                </Badge>
                {k.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeKey(k.id)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer h-7 text-xs"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick start */}
      <Card className="border-slate-200 dark:border-white/[0.08]">
        <CardHeader><CardTitle className="text-slate-800 dark:text-slate-100">Quick Start</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 p-4 text-sm overflow-x-auto">
            {curlSnippet}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
