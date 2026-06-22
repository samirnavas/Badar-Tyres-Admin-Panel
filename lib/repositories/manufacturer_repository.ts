"use server";

import type { Manufacturer } from "../models/Manufacturer";
import type { VehicleType } from "../models/Vehicle";
import { assertNoError, firstOrNull } from "../database/helpers";
import { supabase } from "../supabase";
import { simulateLatency } from "./delay";

const VALID_VEHICLE_TYPES: VehicleType[] = ["Car", "Bike", "Others"];

export interface ManufacturerRow {
  id: string;
  name: string;
  vehicle_types: string[] | null;
  created_at: string;
}

function normalizeVehicleTypes(raw: string[] | null | undefined): VehicleType[] {
  const types = (raw ?? VALID_VEHICLE_TYPES).filter((value): value is VehicleType =>
    VALID_VEHICLE_TYPES.includes(value as VehicleType),
  );
  return types.length > 0 ? types : [...VALID_VEHICLE_TYPES];
}

function manufacturerFromRow(row: ManufacturerRow): Manufacturer {
  return {
    id: row.id,
    name: row.name,
    vehicle_types: normalizeVehicleTypes(row.vehicle_types),
  };
}

export async function getManufacturers(
  vehicleType?: VehicleType,
): Promise<Manufacturer[]> {
  await simulateLatency();

  let query = supabase.from("manufacturers").select("*").order("name");
  if (vehicleType) {
    query = query.contains("vehicle_types", [vehicleType]);
  }

  const result = await query;
  const rows = assertNoError(result, "getManufacturers") as ManufacturerRow[];
  return (rows ?? []).map(manufacturerFromRow);
}

export async function getManufacturerIdByName(name: string): Promise<string | null> {
  const normalized = name.trim();
  if (!normalized) return null;

  const result = await supabase
    .from("manufacturers")
    .select("id")
    .ilike("name", normalized)
    .limit(1);

  const row = firstOrNull(assertNoError(result, "getManufacturerIdByName") as { id: string }[]);
  return row?.id ?? null;
}
