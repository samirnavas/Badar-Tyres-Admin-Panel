import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");
const sqlPath = path.join(
  root,
  "supabase",
  "migrations",
  "20260701180000_create_settings_table.sql",
);
const dataPath = path.join(root, "data", "settings.json");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env.local");
  }
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
  console.error(
    "Set SUPABASE_DB_URL in admin-panel/.env.local (Supabase → Settings → Database → Connection string),",
  );
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");
let settingsData = {};
try {
  settingsData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
} catch (e) {
  console.log("No settings.json found or invalid JSON, using defaults.");
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  
  // 1. Run the SQL migration to create the table and policies
  console.log("Applying SQL migration...");
  await client.query(sql);
  
  // 2. Insert the settings data from JSON
  console.log("Inserting settings data from JSON...");
  const insertQuery = `
    INSERT INTO public.settings (
      shop_name, shop_address, contact_phone, contact_email, 
      default_gst_rate, terms_and_conditions
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `;
  
  const values = [
    settingsData.shop_name || "Badar Tyres & Auto Care",
    settingsData.shop_address || "",
    settingsData.contact_phone || "",
    settingsData.contact_email || "",
    settingsData.default_gst_rate || 0,
    settingsData.terms_and_conditions || ""
  ];
  
  // Check if a row already exists
  const existing = await client.query("SELECT id FROM public.settings LIMIT 1");
  if (existing.rows.length === 0) {
    await client.query(insertQuery, values);
    console.log("Settings data migrated successfully.");
  } else {
    console.log("Settings row already exists, skipping insert.");
  }
} catch (error) {
  console.error("Migration failed:", error);
} finally {
  await client.end();
}
