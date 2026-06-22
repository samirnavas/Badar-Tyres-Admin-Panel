/**
 * Backfills services.in_stock from data/services.json.
 * Run after applying supabase/migrations/add_service_in_stock.sql in the SQL Editor.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(import.meta.dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env.local");
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    if (!line.includes("=")) continue;
    const eq = line.indexOf("=");
    let key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    const comment = value.indexOf(" #");
    if (comment !== -1) value = value.slice(0, comment).trim();
    env[key] = value;
  }
  return env;
}

function readJson(name) {
  const filePath = path.join(root, "data", name);
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split("\n").filter((line) => !line.trim().startsWith("//"));
  return JSON.parse(lines.join("\n"));
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

async function main() {
  const services = readJson("services.json");
  let updated = 0;
  let skipped = 0;

  for (const service of services) {
    const { data, error } = await supabase
      .from("services")
      .update({ in_stock: service.in_stock ?? true })
      .eq("name", service.name)
      .select("id");

    if (error) {
      throw new Error(`update service "${service.name}": ${error.message}`);
    }

    if (!data?.length) {
      console.warn(`No match in Supabase for service "${service.name}" — skipped`);
      skipped += 1;
      continue;
    }

    updated += data.length;
  }

  const { count, error: countErr } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("in_stock", false);
  if (countErr) throw new Error(`count out-of-stock services: ${countErr.message}`);

  console.log(
    `Service stock migration complete (${updated} updated, ${skipped} skipped, ${count ?? 0} out of stock).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
