"use server";

import type { Service } from "../models/Service";
import { assertNoError, firstOrNull } from "../database/helpers";
import { serviceFromRow, serviceToRow, type ServiceRow } from "../database/mappers";
import { supabase } from "../supabase";
import { simulateLatency } from "./delay";

/**
 * Returns all services in the catalog.
 */
export async function getServices(): Promise<Service[]> {
  await simulateLatency();
  const result = await supabase.from("services").select("*").order("name");
  const rows = assertNoError(result, "getServices") as ServiceRow[];
  return (rows ?? []).map(serviceFromRow);
}

/**
 * Returns a single service by id, or null if no match is found.
 */
export async function getServiceById(id: string): Promise<Service | null> {
  await simulateLatency();
  const result = await supabase.from("services").select("*").eq("id", id).limit(1);
  const row = firstOrNull(assertNoError(result, "getServiceById") as ServiceRow[]);
  return row ? serviceFromRow(row) : null;
}

export type CreateServiceInput = Omit<Service, "id">;

/**
 * Creates a new service and adds it to the database.
 */
export async function createService(input: CreateServiceInput): Promise<Service> {
  await simulateLatency();

  const newService: Service = {
    ...input,
    id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };

  const result = await supabase
    .from("services")
    .insert(serviceToRow(newService))
    .select("*")
    .single();
  return serviceFromRow(assertNoError(result, "createService") as ServiceRow);
}

export async function updateService(id: string, data: Partial<Service>): Promise<Service | null> {
  await simulateLatency();
  const existing = await getServiceById(id);
  if (!existing) return null;

  const updated = { ...existing, ...data };
  const result = await supabase
    .from("services")
    .update(serviceToRow(updated))
    .eq("id", id)
    .select("*")
    .single();
  return serviceFromRow(assertNoError(result, "updateService") as ServiceRow);
}

export async function deleteService(id: string): Promise<void> {
  await simulateLatency();
  const result = await supabase.from("services").delete().eq("id", id);
  assertNoError(result, "deleteService");
}
