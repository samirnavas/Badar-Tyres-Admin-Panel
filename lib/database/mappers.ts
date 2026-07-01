import type { Bay } from "../models/Bay";
import type { Customer } from "../models/Customer";
import type { InspectionReport } from "../models/Inspection";
import type { Invoice } from "../models/Invoice";
import type { JobCard, JobCardLineItem } from "../models/JobCard";
import { getJobLineItems } from "../models/JobCard";
import type { Part } from "../models/Part";
import type { Service } from "../models/Service";
import type { User } from "../models/User";
import type { Vehicle } from "../models/Vehicle";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  created_at: string;
  username: string | null;
  phone: string | null;
}

export interface PermissionRow {
  role: string;
  routes: string[];
}

export interface CustomerRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  tax_id: string | null;
  created_at: string;
}

export interface VehicleRow {
  id: string;
  customer_id: string | null;
  make: string;
  make_id: string | null;
  model: string;
  year: number;
  plate_number: string;
  vin: string | null;
  mileage: number | null;
  created_at: string;
  manufacturers?: { name: string } | null;
}

export interface BayRow {
  id: string;
  name: string;
  status: Bay["status"];
}

export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string;
  in_stock: boolean;
}

export interface PartRow {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: Part["category"];
  cost_price: number;
  retail_price: number;
  stock_level: number;
  min_stock_threshold: number;
  location: string | null;
}

export interface JobRow {
  id: string;
  vehicle_id: string | null;
  technician_id: string | null;
  bay_id: string | null;
  status: JobCard["status"];
  line_items: JobCardLineItem[];
  created_at: string;
}

export interface InspectionRow {
  id: string;
  job_id: string | null;
  technician_id: string | null;
  vehicle_id: string | null;
  status: InspectionReport["status"];
  items: InspectionReport["inspectionItems"];
  created_at: string;
}

export interface InvoiceRow {
  id: string;
  job_id: string | null;
  customer_id: string | null;
  subtotal: number;
  discount_amount: number | null;
  discount_type: string | null;
  tax: number;
  total: number;
  amount_paid: number | null;
  status: Invoice["status"];
  payment_method: string | null;
  created_at: string;
}

export interface JobEnrichment {
  customer_id?: string;
  subtotal?: number;
  total_tax?: number;
  total_amount?: number;
  created_by?: string;
  updated_at?: string;
  warranty_end_date?: string | null;
  warranty_notes?: string | null;
  queue_index?: number;
}

function splitName(name: string): { first_name: string; last_name: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: "Unknown", last_name: "Customer" };
  }
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: "-" };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

function joinName(firstName: string, lastName: string): string {
  if (!lastName || lastName === "-") return firstName;
  return `${firstName} ${lastName}`.trim();
}

function recalculateJobTotals(lineItems: JobCardLineItem[]) {
  let subtotal = 0;
  let total_tax = 0;

  for (const item of lineItems) {
    const amount = item.quantity * item.unitPrice;
    const gstRate = item.gst_rate ?? 18;
    subtotal += amount;
    total_tax += (amount * gstRate) / 100;
  }

  return {
    subtotal,
    total_tax,
    total_amount: subtotal + total_tax,
  };
}

export function userFromRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username ?? row.email.split("@")[0]?.toLowerCase(),
    role: row.role,
    email: row.email,
    phone: row.phone ?? "",
  };
}

export function userToRow(user: User, createdAt?: string): UserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: createdAt ?? new Date().toISOString(),
    username: user.username?.trim().toLowerCase() ?? null,
    phone: user.phone || null,
  };
}

export function permissionsFromRows(rows: PermissionRow[]): Record<string, string[]> {
  return Object.fromEntries(rows.map((row) => [row.role, row.routes ?? []]));
}

export function permissionsToRows(
  permissions: Record<string, string[]>,
): PermissionRow[] {
  return Object.entries(permissions).map(([role, routes]) => ({
    role,
    routes,
  }));
}

export function customerFromRow(row: CustomerRow): Customer {
  const notes = row.company?.startsWith("NOTES:")
    ? row.company.slice("NOTES:".length)
    : undefined;
  const company = row.company?.startsWith("NOTES:") ? undefined : row.company ?? undefined;

  return {
    id: row.id,
    name: joinName(row.first_name, row.last_name),
    phone: row.phone,
    email: row.email ?? undefined,
    address: company,
    gst_number: row.tax_id ?? undefined,
    notes,
    created_at: row.created_at,
  };
}

export function customerToRow(customer: Customer): CustomerRow {
  const { first_name, last_name } = splitName(customer.name);
  const company = customer.notes
    ? `NOTES:${customer.notes}`
    : customer.address ?? null;

  return {
    id: customer.id,
    first_name,
    last_name,
    phone: customer.phone,
    email: customer.email ?? null,
    company,
    tax_id: customer.gst_number ?? null,
    created_at: customer.created_at,
  };
}

export function vehicleFromRow(row: VehicleRow): Vehicle {
  const meta = parseVehicleMeta(row.vin);
  return {
    id: row.id,
    customer_id: row.customer_id ?? "",
    type: meta.type ?? "Car",
    manufacturer: row.manufacturers?.name ?? row.make,
    model: row.model,
    registration_number: row.plate_number,
    next_service_date: meta.next_service_date ?? null,
    insurance_expiry: meta.insurance_expiry ?? null,
    pollution_expiry: meta.pollution_expiry ?? null,
    chassis_number: meta.chassis_number,
    engine_number: meta.engine_number,
    color: meta.color,
    created_at: row.created_at,
  };
}

interface VehicleMeta {
  type?: Vehicle["type"];
  next_service_date?: string | null;
  insurance_expiry?: string | null;
  pollution_expiry?: string | null;
  chassis_number?: string;
  engine_number?: string;
  color?: string;
}

function parseVehicleMeta(vin: string | null): VehicleMeta {
  if (!vin?.startsWith("META:")) return {};
  try {
    return JSON.parse(vin.slice("META:".length)) as VehicleMeta;
  } catch {
    return {};
  }
}

function encodeVehicleMeta(vehicle: Vehicle): string | null {
  const meta: VehicleMeta = {
    type: vehicle.type,
    next_service_date: vehicle.next_service_date,
    insurance_expiry: vehicle.insurance_expiry,
    pollution_expiry: vehicle.pollution_expiry,
    chassis_number: vehicle.chassis_number,
    engine_number: vehicle.engine_number,
    color: vehicle.color,
  };

  const hasMeta = Object.values(meta).some((value) => value != null && value !== "");
  if (!hasMeta && !vehicle.chassis_number) {
    return vehicle.chassis_number ?? null;
  }

  return `META:${JSON.stringify(meta)}`;
}

export function vehicleToRow(
  vehicle: Vehicle,
  createdAt?: string,
  makeId?: string | null,
): VehicleRow {
  return {
    id: vehicle.id,
    customer_id: vehicle.customer_id || null,
    make: vehicle.manufacturer,
    make_id: makeId ?? null,
    model: vehicle.model,
    year: new Date().getFullYear(),
    plate_number: vehicle.registration_number,
    vin: encodeVehicleMeta(vehicle),
    mileage: 0,
    created_at: createdAt ?? vehicle.created_at ?? new Date().toISOString(),
  };
}

export function bayFromRow(row: BayRow): Bay {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
  };
}

export function bayToRow(bay: Bay): BayRow {
  return {
    id: bay.id,
    name: bay.name,
    status: bay.status,
  };
}

export function serviceFromRow(row: ServiceRow): Service {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    price: row.price,
    gst_rate: 18,
    in_stock: row.in_stock ?? true,
  };
}

export function serviceToRow(service: Service): ServiceRow {
  return {
    id: service.id,
    name: service.name,
    description: service.name,
    price: service.price,
    duration_minutes: 60,
    category: service.category,
    in_stock: service.in_stock,
  };
}

export function partFromRow(row: PartRow): Part {
  const now = new Date().toISOString();
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    brand: row.brand,
    costPrice: row.cost_price,
    retailPrice: row.retail_price,
    stockLevel: row.stock_level,
    minStockThreshold: row.min_stock_threshold,
    location: row.location ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

export function partToRow(part: Part): PartRow {
  return {
    id: part.id,
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

export function jobFromRow(row: JobRow, enrichment: JobEnrichment = {}): JobCard {
  const rawItems = row.line_items ?? [];
  const metaItem = rawItems.find((item) => item.name === "__meta__") as
    | (JobCardLineItem & { _meta?: JobEnrichment & { customer_id?: string } })
    | undefined;
  const lineItems = rawItems.filter((item) => item.name !== "__meta__");
  const storedMeta = metaItem?._meta ?? {};
  const mergedEnrichment = { ...storedMeta, ...enrichment };
  const totals = recalculateJobTotals(lineItems);

  return {
    id: row.id,
    customer_id: mergedEnrichment.customer_id ?? "",
    vehicle_id: row.vehicle_id ?? "",
    technicianId: row.technician_id,
    bayId: row.bay_id,
    assigned_technician_id: row.technician_id ?? undefined,
    status: row.status,
    line_items: lineItems,
    subtotal: mergedEnrichment.subtotal ?? totals.subtotal,
    total_tax: mergedEnrichment.total_tax ?? totals.total_tax,
    total_amount: mergedEnrichment.total_amount ?? totals.total_amount,
    queue_index: mergedEnrichment.queue_index,
    warranty_end_date: mergedEnrichment.warranty_end_date ?? null,
    warranty_notes: mergedEnrichment.warranty_notes ?? null,
    created_by: mergedEnrichment.created_by ?? "system",
    created_at: row.created_at,
    updated_at: mergedEnrichment.updated_at ?? row.created_at,
  };
}

export function jobToRow(job: JobCard): JobRow {
  const lineItems = getJobLineItems(job).filter((item) => item.name !== "__meta__");
  const metaItem: JobCardLineItem & {
    _meta?: JobEnrichment & { customer_id: string };
  } = {
    name: "__meta__",
    quantity: 0,
    unitPrice: 0,
    total: 0,
    _meta: {
      customer_id: job.customer_id,
      subtotal: job.subtotal,
      total_tax: job.total_tax,
      total_amount: job.total_amount,
      created_by: job.created_by,
      updated_at: job.updated_at,
      warranty_end_date: job.warranty_end_date,
      warranty_notes: job.warranty_notes,
      queue_index: job.queue_index,
    },
  };

  return {
    id: job.id,
    vehicle_id: job.vehicle_id || null,
    technician_id: job.technicianId ?? job.assigned_technician_id ?? null,
    bay_id: job.bayId ?? null,
    status: job.status,
    line_items: [metaItem, ...lineItems],
    created_at: job.created_at,
  };
}

export function inspectionFromRow(row: InspectionRow): InspectionReport {
  return {
    id: row.id,
    jobId: row.job_id ?? "",
    technicianId: row.technician_id ?? "",
    vehicleId: row.vehicle_id ?? "",
    createdAt: row.created_at,
    status: row.status,
    inspectionItems: row.items ?? [],
  };
}

export function inspectionToRow(report: InspectionReport): InspectionRow {
  return {
    id: report.id,
    job_id: report.jobId || null,
    technician_id: report.technicianId || null,
    vehicle_id: report.vehicleId || null,
    status: report.status,
    items: report.inspectionItems,
    created_at: report.createdAt,
  };
}

export function invoiceFromRow(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    jobId: row.job_id ?? "",
    customerId: row.customer_id ?? "",
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    amountPaid: row.amount_paid ?? 0,
    status: row.status,
    paymentMethod: (row.payment_method as Invoice["paymentMethod"]) ?? null,
    discountAmount: row.discount_amount ?? 0,
    discountType: (row.discount_type as Invoice["discountType"]) ?? "fixed",
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

export function invoiceToRow(invoice: Invoice): InvoiceRow {
  return {
    id: invoice.id,
    job_id: invoice.jobId || null,
    customer_id: invoice.customerId || null,
    subtotal: invoice.subtotal,
    discount_amount: invoice.discountAmount,
    discount_type: invoice.discountType,
    tax: invoice.tax,
    total: invoice.total,
    amount_paid: invoice.amountPaid,
    status: invoice.status,
    payment_method: invoice.paymentMethod,
    created_at: invoice.createdAt,
  };
}

export function recalculateJobTotalsFromItems(lineItems: JobCardLineItem[]) {
  return recalculateJobTotals(lineItems);
}
