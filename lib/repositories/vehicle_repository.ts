"use server";

import type { Vehicle } from "../models/Vehicle";
import { readData, writeData } from "../db";
import { generateId } from "../generateId";
import { simulateLatency } from "./delay";

const FILE_NAME = "vehicles.json";

/**
 * Returns all vehicles.
 */
export async function getVehicles(): Promise<Vehicle[]> {
  await simulateLatency();
  return readData<Vehicle[]>(FILE_NAME);
}

/**
 * Returns a single vehicle by id, or null if no match is found.
 */
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  await simulateLatency();
  const vehicles = await readData<Vehicle[]>(FILE_NAME);
  return vehicles.find((vehicle) => vehicle.id === id) ?? null;
}

/**
 * Returns every vehicle belonging to a given customer (relational lookup
 * by customer_id). Returns an empty array when the customer has none.
 */
export async function getVehiclesByCustomerId(
  customerId: string,
): Promise<Vehicle[]> {
  await simulateLatency();
  const vehicles = await readData<Vehicle[]>(FILE_NAME);
  return vehicles.filter((vehicle) => vehicle.customer_id === customerId);
}

/**
 * Creates a new vehicle, persists it to the JSON file, and returns it.
 */
export async function createVehicle(
  data: Omit<Vehicle, "id">,
): Promise<Vehicle> {
  await simulateLatency();

  const vehicle: Vehicle = { ...data, id: generateId() };
  const vehicles = await readData<Vehicle[]>(FILE_NAME);
  vehicles.push(vehicle);
  await writeData(FILE_NAME, vehicles);

  return vehicle;
}

/**
 * Updates an existing vehicle.
 */
export async function updateVehicle(
  id: string,
  data: Partial<Omit<Vehicle, "id" | "customer_id">>,
): Promise<Vehicle> {
  await simulateLatency();

  const vehicles = await readData<Vehicle[]>(FILE_NAME);
  const index = vehicles.findIndex((v) => v.id === id);
  if (index === -1) {
    throw new Error("Vehicle not found");
  }

  const updatedVehicle = { ...vehicles[index], ...data };
  vehicles[index] = updatedVehicle;
  await writeData(FILE_NAME, vehicles);

  return updatedVehicle;
}

import type { Customer } from "../models/Customer";
import type { JobCard } from "../models/JobCard";

export interface Vehicle360 {
  vehicle: Vehicle;
  customer: Customer | null;
  jobs: JobCard[];
}

export async function getVehicle360(vehicleId: string): Promise<Vehicle360 | null> {
  await simulateLatency();
  const vehicles = await readData<Vehicle[]>(FILE_NAME);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return null;

  const customers = await readData<Customer[]>("customers.json");
  const customer = customers.find((c) => c.id === vehicle.customer_id) || null;

  const allJobs = await readData<JobCard[]>("jobs.json");
  const jobs = allJobs
    .filter((j) => j.vehicle_id === vehicleId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { vehicle, customer, jobs };
}
