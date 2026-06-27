/**
 * Applies supabase/migrations/20260624200000_technician_inspection_checklist_rpc.sql
 *
 * Requires SUPABASE_DB_URL in .env.local, or run the SQL file in Supabase SQL Editor.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");
const sqlPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260624200000_technician_inspection_checklist_rpc.sql",
);

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) throw new Error("Missing .env.local");
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    if (!line.includes("=")) continue;
    const eq = line.indexOf("=");
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    const comment = value.indexOf(" #");
    if (comment !== -1) value = value.slice(0, comment).trim();
    env[key] = value;
  }
  return env;
}

const env = loadEnv();
const dbUrl = env.SUPABASE_DB_URL || process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Set SUPABASE_DB_URL in admin-panel/.env.local, or run this SQL in Supabase SQL Editor:");
  console.error(`  ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("Technician RPC migration applied successfully.");
} finally {
  await client.end();
}
