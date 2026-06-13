import { NextRequest, NextResponse } from "next/server";
import { redis, scoreCacheKey } from "@/lib/redis";
import { toCSVRaw } from "@/lib/csv";
import type { IntentScore } from "@/lib/types";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "CSV file required (field: file)" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in CSV" }, { status: 400 });
  }

  // ── Resolve scores from cache where available ─────────────────────────────
  const scored: Array<Record<string, string | number>> = [];

  await Promise.all(
    rows.map(async (row) => {
      const domain = (row.domain ?? row.company ?? "").toLowerCase().trim();
      const cached = domain ? await redis.get<IntentScore>(scoreCacheKey(domain)) : null;

      scored.push({
        ...row,
        intent_score: cached?.intent_score ?? 0,
        score_band: cached?.score_band ?? "COLD",
        ai_summary: cached?.ai_summary ?? "Score not available — call /api/v1/score first",
      });
    })
  );

  // Sort by intent score descending
  scored.sort((a, b) => (b.intent_score as number) - (a.intent_score as number));

  // Build dynamic columns from the data keys
  if (scored.length === 0) {
    return new NextResponse("", {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="vesperwise_prioritized.csv"` },
    });
  }

  const columns = Object.keys(scored[0]).map((key) => ({ key, label: key }));
  const csvOutput = toCSVRaw(columns, scored);

  return new NextResponse(csvOutput, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vesperwise_prioritized.csv"`,
    },
  });
}

// ── CSV parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}
