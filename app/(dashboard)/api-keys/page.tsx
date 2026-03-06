"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  }

  async function revokeKey(id: string) {
    await fetch(`/api/user/api-keys?id=${id}`, { method: "DELETE" });
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: false } : k)));
  }

  const curlSnippet = newKey
    ? `curl "https://intentiq.com/api/v1/score?domain=acme.com" \\\n  -H "Authorization: Bearer ${newKey}"`
    : `curl "https://intentiq.com/api/v1/score?domain=acme.com" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">Generate and manage keys for programmatic access.</p>
      </div>

      {newKey && (
        <Card className="border-green-500">
          <CardHeader><CardTitle className="text-green-600">New Key Generated — Copy Now</CardTitle></CardHeader>
          <CardContent>
            <code className="block rounded bg-muted p-3 text-sm break-all">{newKey}</code>
            <p className="mt-2 text-xs text-muted-foreground">This key will not be shown again.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Generate New Key</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Label (e.g. Production)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <Button onClick={generateKey} disabled={generating}>
            {generating ? "Generating…" : "Generate"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your Keys</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {keys.length === 0 && (
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
          )}
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{k.label}</p>
                <p className="text-xs text-muted-foreground">
                  Last used: {k.last_used ? new Date(k.last_used).toLocaleDateString() : "Never"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={k.is_active ? "default" : "outline"}>
                  {k.is_active ? "Active" : "Revoked"}
                </Badge>
                {k.is_active && (
                  <Button variant="destructive" size="sm" onClick={() => revokeKey(k.id)}>
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Quick Start</CardTitle></CardHeader>
        <CardContent>
          <pre className="rounded-md bg-muted p-4 text-sm overflow-x-auto">{curlSnippet}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
