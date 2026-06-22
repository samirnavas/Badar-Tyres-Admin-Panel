/**
 * Seeds manufacturers from data/manufacturers.json and backfills vehicles.make_id.
 * Run after applying supabase/migrations/create_manufacturers_table.sql in the SQL Editor.
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

const DEFAULT_VEHICLE_TYPES = ["Car", "Bike", "Others"];

const MANUFACTURER_VEHICLE_TYPES = {
  toyota: ["Car"],
  honda: ["Car"],
  hyundai: ["Car"],
  volkswagen: ["Car"],
  tvs: ["Car", "Bike"],
  "royal enfield": ["Bike"],
  mahindra: ["Car"],
  "maruti suzuki": ["Car"],
  bajaj: ["Bike"],
  ktm: ["Bike"],
  hero: ["Bike"],
  yamaha: ["Bike"],
};

function vehicleTypesForName(name) {
  return MANUFACTURER_VEHICLE_TYPES[name.trim().toLowerCase()] ?? DEFAULT_VEHICLE_TYPES;
}

async function upsertManufacturers(names) {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (unique.length === 0) return;

  const { error } = await supabase.from("manufacturers").upsert(
    unique.map((name) => ({
      name,
      vehicle_types: vehicleTypesForName(name),
    })),
    { onConflict: "name", ignoreDuplicates: true },
  );

  if (error) throw new Error(`manufacturers upsert: ${error.message}`);
}

async function backfillVehicleMakeIds() {
  const { data: manufacturers, error: mErr } = await supabase
    .from("manufacturers")
    .select("id, name");
  if (mErr) throw new Error(`fetch manufacturers: ${mErr.message}`);

  const byName = new Map(
    (manufacturers ?? []).map((m) => [m.name.toLowerCase(), m.id]),
  );

  const { data: vehicles, error: vErr } = await supabase
    .from("vehicles")
    .select("id, make, make_id");
  if (vErr) throw new Error(`fetch vehicles: ${vErr.message}`);

  for (const vehicle of vehicles ?? []) {
    if (vehicle.make_id || !vehicle.make?.trim()) continue;
    const makeId = byName.get(vehicle.make.trim().toLowerCase());
    if (!makeId) continue;

    const { error } = await supabase
      .from("vehicles")
      .update({ make_id: makeId })
      .eq("id", vehicle.id);
    if (error) throw new Error(`update vehicle ${vehicle.id}: ${error.message}`);
  }
}

async function main() {
  const fromJson = readJson("manufacturers.json").map((m) => m.name);

  const { data: vehicleRows, error: makesErr } = await supabase
    .from("vehicles")
    .select("make");
  if (makesErr) throw new Error(`fetch vehicle makes: ${makesErr.message}`);

  const fromVehicles = (vehicleRows ?? []).map((v) => v.make).filter(Boolean);
  await upsertManufacturers([...fromJson, ...fromVehicles]);
  await backfillVehicleMakeIds();

  const { count, error: countErr } = await supabase
    .from("manufacturers")
    .select("*", { count: "exact", head: true });
  if (countErr) throw new Error(`count manufacturers: ${countErr.message}`);

  console.log(`Manufacturers migration complete (${count ?? 0} rows).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
