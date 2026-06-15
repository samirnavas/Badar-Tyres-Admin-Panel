import type { ShopSettings } from "../models/ShopSettings";
import { mockShopSettings } from "../mock_db";
import { simulateLatency } from "./delay";

// Held in a mutable module-level object so updateSettings persists across
// calls for the lifetime of the session, mimicking a single settings row.
let currentSettings: ShopSettings = { ...mockShopSettings };

/**
 * Returns the shop's global settings.
 */
export async function getSettings(): Promise<ShopSettings> {
  await simulateLatency();
  return { ...currentSettings };
}

/**
 * Persists a full settings update and returns the saved record.
 */
export async function updateSettings(
  data: ShopSettings,
): Promise<ShopSettings> {
  await simulateLatency();
  currentSettings = { ...data };
  return { ...currentSettings };
}
