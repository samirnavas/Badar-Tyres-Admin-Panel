import type { Vehicle } from "../models/Vehicle";
import { mockVehicles } from "../mock_db";
import { generateId } from "../generateId";
import { simulateLatency } from "./delay";

/**
 * Returns all vehicles.
 */
export async function getVehicles(): Promise<Vehicle[]> {
  await simulateLatency();
  return [...mockVehicles];
}

/**
 * Returns a single vehicle by id, or null if no match is found.
 */
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  await simulateLatency();
  return mockVehicles.find((vehicle) => vehicle.id === id) ?? null;
}

/**
 * Returns every vehicle belonging to a given customer (relational lookup
 * by customer_id). Returns an empty array when the customer has none.
 */
export async function getVehiclesByCustomerId(
  customerId: string,
): Promise<Vehicle[]> {
  await simulateLatency();
  return mockVehicles.filter((vehicle) => vehicle.customer_id === customerId);
}

/**
 * Simulates creating a new vehicle: generates a mock id, persists it to the
 * mock array, and returns the saved record.
 */
export async function createVehicle(
  data: Omit<Vehicle, "id">,
): Promise<Vehicle> {
  await simulateLatency();

  const vehicle: Vehicle = { ...data, id: generateId() };
  mockVehicles.push(vehicle);
  return vehicle;
}
