import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const idMap = new Map();

function resolveId(id) {
  if (id == null || id === "") return id;
  if (UUID_RE.test(id)) return id;
  if (idMap.has(id)) return idMap.get(id);
  const newId = randomUUID();
  idMap.set(id, newId);
  return newId;
}

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = join(__dirname, "..", file);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      const inlineComment = value.indexOf(" #");
      if (inlineComment !== -1) {
        value = value.slice(0, inlineComment).trim();
      }
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function readJson(filename) {
  const path = join(DATA_DIR, filename);
  const raw = readFileSync(path, "utf8");
  const withoutComments = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  return JSON.parse(withoutComments);
}

function splitName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "Unknown", last_name: "Customer" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "-" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

function encodeVehicleMeta(vehicle) {
  const meta = {
    type: vehicle.type,
    next_service_date: vehicle.next_service_date,
    insurance_expiry: vehicle.insurance_expiry,
    pollution_expiry: vehicle.pollution_expiry,
    chassis_number: vehicle.chassis_number,
    engine_number: vehicle.engine_number,
    color: vehicle.color,
  };
  const hasMeta = Object.values(meta).some((value) => value != null && value !== "");
  if (!hasMeta && !vehicle.chassis_number) return vehicle.chassis_number ?? null;
  return `META:${JSON.stringify(meta)}`;
}

function toUserRow(user) {
  return {
    id: resolveId(user.id),
    name: user.name,
    email: user.email || `${user.username || user.id}@badartyres.local`,
    role: user.role,
    username: user.username?.trim().toLowerCase() ?? null,
    phone: user.phone ?? null,
    created_at: new Date().toISOString(),
  };
}

function toCustomerRow(customer) {
  const { first_name, last_name } = splitName(customer.name);
  const company = customer.notes
    ? `NOTES:${customer.notes}`
    : customer.address ?? null;

  return {
    id: resolveId(customer.id),
    first_name,
    last_name,
    phone: customer.phone,
    email: customer.email ?? null,
    company,
    tax_id: customer.gst_number ?? null,
    created_at: customer.created_at,
  };
}

function toVehicleRow(vehicle) {
  return {
    id: resolveId(vehicle.id),
    customer_id: resolveId(vehicle.customer_id) ?? null,
    make: vehicle.manufacturer,
    model: vehicle.model,
    year: new Date().getFullYear(),
    plate_number: vehicle.registration_number,
    vin: encodeVehicleMeta(vehicle),
    mileage: 0,
    created_at: new Date().toISOString(),
  };
}

function toBayRow(bay) {
  return {
    id: resolveId(bay.id),
    name: bay.name,
    status: bay.status,
  };
}

function toServiceRow(service) {
  return {
    id: resolveId(service.id),
    name: service.name,
    description: service.name,
    price: service.price,
    duration_minutes: 60,
    category: service.category,
    in_stock: service.in_stock ?? true,
  };
}

function toPartRow(part) {
  return {
    id: resolveId(part.id),
    sku: part.sku,
    name: part.name,
    brand: part.brand,
    category: part.category,
    cost_price: part.costPrice,
    retail_price: part.retailPrice,
    stock_level: part.stockLevel,
    min_stock_threshold: part.minStockThreshold,
    location: part.location || null,
  };
}

function toJobRow(job) {
  const lineItems = (job.line_items ?? [])
    .filter((item) => item.name !== "__meta__")
    .map((item) => ({
      ...item,
      serviceId: item.serviceId ? resolveId(item.serviceId) : undefined,
      partId: item.partId ? resolveId(item.partId) : undefined,
    }));
  const metaItem = {
    name: "__meta__",
    quantity: 0,
    unitPrice: 0,
    total: 0,
    _meta: {
      customer_id: resolveId(job.customer_id),
      subtotal: job.subtotal,
      total_tax: job.total_tax,
      total_amount: job.total_amount,
      created_by: resolveId(job.created_by),
      updated_at: job.updated_at,
      warranty_end_date: job.warranty_end_date,
      warranty_notes: job.warranty_notes,
      queue_index: job.queue_index,
    },
  };

  return {
    id: resolveId(job.id),
    vehicle_id: resolveId(job.vehicle_id) ?? null,
    technician_id: resolveId(job.technicianId ?? job.assigned_technician_id) ?? null,
    bay_id: resolveId(job.bayId) ?? null,
    status: job.status,
    line_items: [metaItem, ...lineItems],
    created_at: job.created_at,
  };
}

function toInspectionRow(report) {
  return {
    id: resolveId(report.id),
    job_id: resolveId(report.jobId) ?? null,
    technician_id: resolveId(report.technicianId) ?? null,
    vehicle_id: resolveId(report.vehicleId) ?? null,
    status: report.status,
    items: report.inspectionItems ?? [],
    created_at: report.createdAt,
  };
}

function toInvoiceRow(invoice) {
  return {
    id: resolveId(invoice.id),
    job_id: resolveId(invoice.jobId) ?? null,
    customer_id: resolveId(invoice.customerId) ?? null,
    subtotal: invoice.subtotal,
    discount_amount: invoice.discountAmount,
    discount_type: invoice.discountType,
    tax: invoice.tax,
    total: invoice.total,
    amount_paid: invoice.amountPaid,
    status: invoice.status,
    payment_method: invoice.paymentMethod ?? null,
    created_at: invoice.createdAt,
  };
}

async function upsertTable(supabase, table, rows, label, onConflict = "id") {
  if (!rows.length) {
    console.log(`[skip] ${label}: no records to migrate`);
    return;
  }

  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) {
    console.error(`[error] ${label}: ${error.message}`);
    throw error;
  }

  console.log(`[ok] ${label}: migrated ${rows.length} record(s)`);
}

async function migratePermissions(supabase, permissionsObject) {
  const rows = Object.entries(permissionsObject).map(([role, routes]) => ({
    role,
    routes,
  }));

  if (!rows.length) {
    console.log("[skip] permissions: no records to migrate");
    return;
  }

  const { error } = await supabase
    .from("permissions")
    .upsert(rows, { onConflict: "role" });

  if (error) {
    console.error(`[error] permissions: ${error.message}`);
    throw error;
  }

  console.log(`[ok] permissions: migrated ${rows.length} role(s)`);
}

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log("Starting JSON → Supabase migration...\n");

  const users = readJson("users.json").map(toUserRow);
  await upsertTable(supabase, "users", users, "users");

  const permissions = readJson("permissions.json");
  await migratePermissions(supabase, permissions);

  const customers = readJson("customers.json").map(toCustomerRow);
  await upsertTable(supabase, "customers", customers, "customers");

  const vehicles = readJson("vehicles.json").map(toVehicleRow);
  await upsertTable(supabase, "vehicles", vehicles, "vehicles");

  const bays = readJson("bays.json").map(toBayRow);
  await upsertTable(supabase, "bays", bays, "bays");

  const services = readJson("services.json").map(toServiceRow);
  await upsertTable(supabase, "services", services, "services");

  const parts = readJson("parts.json").map(toPartRow);
  await upsertTable(supabase, "parts", parts, "parts");

  const jobs = readJson("jobs.json").map(toJobRow);
  await upsertTable(supabase, "jobs", jobs, "jobs");

  const inspections = readJson("inspections.json").map(toInspectionRow);
  await upsertTable(supabase, "inspections", inspections, "inspections");

  const invoices = readJson("invoices.json").map(toInvoiceRow);
  await upsertTable(supabase, "invoices", invoices, "invoices");

  console.log("\nMigration complete.");
}

main().catch((error) => {
  console.error("\nMigration failed:", error.message ?? error);
  process.exit(1);
});
