"use server";

import type { ShopSettings } from "../models/ShopSettings";
import { readData, writeData } from "../db";
import { simulateLatency } from "./delay";

const FILE_NAME = "settings.json";

/**
 * Returns the shop's global settings.
 */
export async function getSettings(): Promise<ShopSettings> {
  await simulateLatency();
  return readData<ShopSettings>(FILE_NAME);
}

/**
 * Persists a full settings update and returns the saved record.
 */
export async function updateSettings(
  data: ShopSettings,
): Promise<ShopSettings> {
  await simulateLatency();
  await writeData(FILE_NAME, data);
  return { ...data };
}
