/**
 * Migration runner — uses Supabase's session pooler which accepts
 * the service_role JWT as the password for the `postgres` user.
 * Run: node scripts/migrate.mjs
 */
import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import { config } from "dotenv";

// Load .env.local
config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const ref = "grgrigjshxdohcpuhfsg";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY not set in .env.local");
  process.exit(1);
}

// Supabase session pooler: accepts service_role JWT as password
const connectionString =
  `postgresql://postgres.${ref}:${serviceRoleKey}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;

const migrationFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../supabase/migrations/20260305000000_initial_schema.sql"
);

const sql = readFileSync(migrationFile, "utf-8");

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  console.log("Connecting to Supabase...");
  await client.connect();
  console.log("Connected. Running migration...");
  await client.query(sql);
  console.log("Migration completed successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
