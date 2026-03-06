"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function BulkScorerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) setFile(f);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    setProgress(10);

    try {
      const form = new FormData();
      form.append("file", file);
      setProgress(30);

      const res = await fetch("/api/v1/prioritize", { method: "POST", body: form });
      setProgress(90);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }

      const blob = await res.blob();
      setDownloadUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Scorer</h1>
        <p className="text-muted-foreground">Upload a CSV of companies and get them back sorted by intent score.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Upload CSV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="space-y-1">
                <p className="font-medium">{file.name}</p>
                <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Drag & drop a CSV here, or click to select.<br />
                CSV must have a <code>domain</code> or <code>company</code> column.
              </p>
            )}
          </div>

          {loading && <Progress value={progress} />}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!file || loading}>
              {loading ? "Scoring…" : "Score & Prioritize"}
            </Button>
            {downloadUrl && (
              <Button variant="outline" asChild>
                <a href={downloadUrl} download="intentiq_prioritized.csv">
                  Download Results
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
