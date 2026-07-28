import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { shouldPromoteEvidence } from "./promotion.mjs";

const execFileAsync = promisify(execFile);
const QUEUE_NAME = "hiring-refresh";
const CRAWLER_PATH = fileURLToPath(new URL("./crawl.py", import.meta.url));

function crawlerEnvironment() {
  const allowed = [
    "LANG",
    "LC_ALL",
    "PATH",
    "PLAYWRIGHT_BROWSERS_PATH",
    "PYTHONPATH",
    "SCRAPLING_BROWSER_ENABLED",
    "SSL_CERT_DIR",
    "SSL_CERT_FILE",
    "TMPDIR",
  ];
  return Object.fromEntries([
    ...allowed.flatMap((name) => process.env[name] ? [[name, process.env[name]]] : []),
    ["HOME", "/tmp"],
  ]);
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function connectionFromUrl(redisUrl) {
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || (parsed.protocol === "rediss:" ? 6380 : 6379)),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

const supabase = createClient(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { domain, schemaVersion, shadow } = job.data;
    if (typeof domain !== "string" || typeof schemaVersion !== "string") {
      throw new Error("Invalid hiring refresh payload");
    }

    const { stdout } = await execFileAsync(
      process.env.PYTHON_BIN || "python3",
      [CRAWLER_PATH, "--domain", domain, "--schema-version", schemaVersion],
      {
        timeout: Number(process.env.SCRAPLING_JOB_TIMEOUT_MS || 90_000),
        maxBuffer: 5 * 1024 * 1024,
        // The parser handles untrusted web content and must not inherit Redis,
        // Supabase, or unrelated application credentials.
        env: crawlerEnvironment(),
      }
    );

    const result = JSON.parse(stdout);
    const now = new Date().toISOString();
    const promoted = shouldPromoteEvidence({
      requestedShadow: shadow !== false,
      adapters: result.evidence?.adapters,
      allowlist: process.env.SCRAPLING_PROMOTED_ADAPTERS,
    });
    const evidenceRow = {
      canonical_domain: domain,
      signal_type: "hiring",
      source: "scrapling",
      schema_version: schemaVersion,
      status: result.status,
      observed_at: result.observed_at,
      fetched_at: result.fetched_at || now,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      evidence: result.evidence,
      raw_payload: result,
      shadow: !promoted,
    };
    const { error } = await supabase.rpc("persist_signal_evidence", {
      p_evidence: [evidenceRow],
    });

    if (error) throw new Error(`signal_evidence persistence failed: ${error.message}`);
    return {
      domain,
      status: result.status,
      jobCount: result.evidence?.job_count ?? 0,
      adapters: result.evidence?.adapters ?? [],
      promoted,
    };
  },
  {
    connection: connectionFromUrl(requiredEnv("BULLMQ_REDIS_URL")),
    // The crawler itself is sequential, and a single worker slot prevents two
    // jobs from hitting the same shared ATS host concurrently.
    concurrency: 1,
    lockDuration: 120_000,
  }
);

worker.on("failed", (job, error) => {
  console.error("[hiring-refresh] job failed", job?.id, error);
});

async function shutdown() {
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
