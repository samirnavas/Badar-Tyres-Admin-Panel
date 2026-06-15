import type { Service } from "../models/Service";
import { mockServices } from "../mock_db";
import { simulateLatency } from "./delay";

/**
 * Returns all services in the catalog.
 */
export async function getServices(): Promise<Service[]> {
  await simulateLatency();
  return [...mockServices];
}

/**
 * Returns a single service by id, or null if no match is found.
 */
export async function getServiceById(id: string): Promise<Service | null> {
  await simulateLatency();
  return mockServices.find((service) => service.id === id) ?? null;
}
