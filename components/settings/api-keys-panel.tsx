"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Key, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SettingsSection } from "@/components/settings/settings-section";
import type { DbApiKey } from "@/lib/types";

type ApiKeyRow = Pick<DbApiKey, "id" | "label" | "last_used" | "is_active" | "created_at">;

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ApiKeysPanelProps {
  /** Injectable for tests/storybook; production always fetches from the API. */
  initialKeys?: ApiKeyRow[];
}

export function ApiKeysPanel({ initialKeys }: ApiKeysPanelProps) {
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys ?? []);
  const [loading, setLoading] = useState(initialKeys === undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null);
  const [revoking, setRevoking] = useState(false);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/api-keys");
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialKeys === undefined) loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || "Default" }),
      });
      if (!res.ok) throw new Error("Failed to create key");
      const data = await res.json();
      setNewKey(data.key);
      setLabel("");
      await loadKeys();
      toast.success("API key created");
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    setNewKey(null);
    setCopied(false);
    setLabel("");
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/user/api-keys?id=${revokeTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke key");
      await loadKeys();
      toast.success("API key revoked");
      setRevokeTarget(null);
    } catch {
      toast.error("Failed to revoke API key");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <SettingsSection
      title="API keys"
      description="Keys for programmatic access to scoring, bulk, and watchlist endpoints."
      actions={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          New key
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-10 space-y-3">
          <Key className="h-6 w-6 mx-auto text-slate-400" />
          <p className="text-sm text-slate-500">You don&apos;t have any API keys yet.</p>
          <div className="flex items-center justify-center gap-3">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Create your first key
            </Button>
            <a href="/docs" className="text-xs text-cyan-500 hover:underline">
              API reference
            </a>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id} className={!key.is_active ? "opacity-50" : undefined}>
                <TableCell className="font-medium">{key.label}</TableCell>
                <TableCell>{formatDate(key.created_at)}</TableCell>
                <TableCell>{formatDate(key.last_used)}</TableCell>
                <TableCell>
                  <Badge variant={key.is_active ? "default" : "outline"}>
                    {key.is_active ? "Active" : "Revoked"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {key.is_active && (
                    <Button variant="ghost" size="icon-sm" onClick={() => setRevokeTarget(key)} aria-label={`Revoke ${key.label}`}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => (open ? setCreateOpen(true) : closeCreateDialog())}>
        <DialogContent>
          {!newKey ? (
            <>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>Give it a label so you can recognize it later.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="key-label">Label</Label>
                <Input
                  id="key-label"
                  placeholder="e.g. Production integration"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeCreateDialog}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Create key
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Your new API key</DialogTitle>
                <DialogDescription>
                  This is the only time this key is shown. Copy it now and store it somewhere safe.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 border border-border rounded-lg p-3 bg-muted/40">
                <code className="text-xs font-mono break-all flex-1">{newKey}</code>
                <Button variant="outline" size="icon-sm" onClick={copyKey} aria-label="Copy key">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeCreateDialog}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke &ldquo;{revokeTarget?.label}&rdquo;?</DialogTitle>
            <DialogDescription>
              Any integration using this key will immediately lose access. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={revoking}>
              {revoking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Revoke key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
