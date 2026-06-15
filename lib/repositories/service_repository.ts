"use server";

import type { Service } from "../models/Service";
import { readData, writeData } from "../db";
import { simulateLatency } from "./delay";

const FILE_NAME = "services.json";

/**
 * Returns all services in the catalog.
 */
export async function getServices(): Promise<Service[]> {
  await simulateLatency();
  return readData<Service[]>(FILE_NAME);
}

/**
 * Returns a single service by id, or null if no match is found.
 */
export async function getServiceById(id: string): Promise<Service | null> {
  await simulateLatency();
  const services = await readData<Service[]>(FILE_NAME);
  return services.find((service) => service.id === id) ?? null;
}

export type CreateServiceInput = Omit<Service, "id">;

/**
 * Creates a new service and adds it to the JSON database.
 */
export async function createService(input: CreateServiceInput): Promise<Service> {
  await simulateLatency();

  const newService: Service = {
    ...input,
    id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };

  const services = await readData<Service[]>(FILE_NAME);
  services.unshift(newService);
  await writeData(FILE_NAME, services);

  return newService;
}
