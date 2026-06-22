"use server";

import type { Customer } from "../models/Customer";
import type { Vehicle } from "../models/Vehicle";
import type { JobCard } from "../models/JobCard";
import { assertNoError, firstOrNull } from "../database/helpers";
import {
  customerFromRow,
  jobFromRow,
  vehicleFromRow,
  vehicleToRow,
  type CustomerRow,
  type JobRow,
  type VehicleRow,
} from "../database/mappers";
import { generateId } from "../generateId";
import { supabase } from "../supabase";
import { simulateLatency } from "./delay";
import { getManufacturerIdByName } from "./manufacturer_repository";

const VEHICLE_SELECT = "*, manufacturers!make_id(name)";

async function resolveMakeId(manufacturer: string): Promise<string> {
  const makeId = await getManufacturerIdByName(manufacturer);
  if (!makeId) {
    throw new Error(`Unknown manufacturer: ${manufacturer}`);
  }
  return makeId;
}

/**
 * Returns all vehicles.
 */
export async function getVehicles(): Promise<Vehicle[]> {
  await simulateLatency();
  const result = await supabase.from("vehicles").select(VEHICLE_SELECT).order("plate_number");
  const rows = assertNoError(result, "getVehicles") as VehicleRow[];
  return (rows ?? []).map(vehicleFromRow);
}

/**
 * Returns a single vehicle by id, or null if no match is found.
 */
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  await simulateLatency();
  const result = await supabase.from("vehicles").select(VEHICLE_SELECT).eq("id", id).limit(1);
  const row = firstOrNull(assertNoError(result, "getVehicleById") as VehicleRow[]);
  return row ? vehicleFromRow(row) : null;
}

/**
 * Returns every vehicle belonging to a given customer (relational lookup
 * by customer_id). Returns an empty array when the customer has none.
 */
export async function getVehiclesByCustomerId(
  customerId: string,
): Promise<Vehicle[]> {
  await simulateLatency();
  const result = await supabase
    .from("vehicles")
    .select(VEHICLE_SELECT)
    .eq("customer_id", customerId)
    .order("plate_number");
  const rows = assertNoError(result, "getVehiclesByCustomerId") as VehicleRow[];
  return (rows ?? []).map(vehicleFromRow);
}

/**
 * Creates a new vehicle, persists it to the database, and returns it.
 */
export async function createVehicle(
  data: Omit<Vehicle, "id">,
): Promise<Vehicle> {
  await simulateLatency();

  const vehicle: Vehicle = { ...data, id: generateId() };
  const makeId = await resolveMakeId(vehicle.manufacturer);
  const result = await supabase
    .from("vehicles")
    .insert(vehicleToRow(vehicle, undefined, makeId))
    .select(VEHICLE_SELECT)
    .single();
  return vehicleFromRow(assertNoError(result, "createVehicle") as VehicleRow);
}

/**
 * Updates an existing vehicle.
 */
export async function updateVehicle(
  id: string,
  data: Partial<Omit<Vehicle, "id" | "customer_id">>,
): Promise<Vehicle> {
  await simulateLatency();

  const existing = await getVehicleById(id);
  if (!existing) {
    throw new Error("Vehicle not found");
  }

  const updatedVehicle = { ...existing, ...data };
  const makeId = await resolveMakeId(updatedVehicle.manufacturer);
  const result = await supabase
    .from("vehicles")
    .update(vehicleToRow(updatedVehicle, undefined, makeId))
    .eq("id", id)
    .select(VEHICLE_SELECT)
    .single();
  return vehicleFromRow(assertNoError(result, "updateVehicle") as VehicleRow);
}

export interface Vehicle360 {
  vehicle: Vehicle;
  customer: Customer | null;
  jobs: JobCard[];
}

export async function getVehicle360(vehicleId: string): Promise<Vehicle360 | null> {
  await simulateLatency();
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) return null;

  const [customerResult, jobsResult] = await Promise.all([
    supabase.from("customers").select("*").eq("id", vehicle.customer_id).limit(1),
    supabase.from("jobs").select("*").eq("vehicle_id", vehicleId),
  ]);

  const customerRow = firstOrNull(assertNoError(customerResult, "getVehicle360") as CustomerRow[]);
  const customer = customerRow ? customerFromRow(customerRow) : null;

  const jobs = (assertNoError(jobsResult, "getVehicle360") as JobRow[])
    .map((row) => jobFromRow(row))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { vehicle, customer, jobs };
}

export interface NotificationItem {
  id: string;
  vehicleId: string;
  regNo: string;
  customerName: string;
  customerPhone: string;
  type: "Insurance" | "Pollution" | "Service";
  dueDate: string;
  isExpired: boolean;
  daysRemaining: number;
}

export async function getExpiringNotifications(daysThreshold = 30): Promise<NotificationItem[]> {
  await simulateLatency();

  const [vehiclesResult, customersResult] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_SELECT),
    supabase.from("customers").select("*"),
  ]);

  const vehicles = (assertNoError(vehiclesResult, "getExpiringNotifications") as VehicleRow[]).map(
    vehicleFromRow,
  );
  const customers = (assertNoError(customersResult, "getExpiringNotifications") as CustomerRow[]).map(
    customerFromRow,
  );

  const notifications: NotificationItem[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  vehicles.forEach((vehicle) => {
    const customer = customers.find((c) => c.id === vehicle.customer_id);
    const customerName = customer?.name || "Unknown";
    const customerPhone = customer?.phone || "N/A";

    const checkExpiry = (dateString: string | null | undefined, type: "Insurance" | "Pollution" | "Service") => {
      if (!dateString) return;

      const dueDate = new Date(dateString);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining <= daysThreshold) {
        notifications.push({
          id: `${vehicle.id}-${type}`,
          vehicleId: vehicle.id,
          regNo: vehicle.registration_number,
          customerName,
          customerPhone,
          type,
          dueDate: dateString,
          isExpired: daysRemaining < 0,
          daysRemaining,
        });
      }
    };

    checkExpiry(vehicle.insurance_expiry, "Insurance");
    checkExpiry(vehicle.pollution_expiry, "Pollution");
    checkExpiry(vehicle.next_service_date, "Service");
  });

  notifications.sort((a, b) => {
    if (a.isExpired && !b.isExpired) return -1;
    if (!a.isExpired && b.isExpired) return 1;
    return a.daysRemaining - b.daysRemaining;
  });

  return notifications;
}
