"use server";

import type { ShopSettings } from "../models/ShopSettings";
import { simulateLatency } from "./delay";
import { supabase } from "../supabase";
import { assertNoError, firstOrNull } from "../database/helpers";

const SETTINGS_COLUMNS = "shop_name, shop_address, contact_phone, contact_email, default_gst_rate, terms_and_conditions";

/**
 * Returns the shop's global settings from Supabase.
 */
export async function getSettings(): Promise<ShopSettings> {
  await simulateLatency();
  const result = await supabase
    .from("settings")
    .select(SETTINGS_COLUMNS)
    .limit(1);
    
  const row = firstOrNull(assertNoError(result, "getSettings") as ShopSettings[]);
  if (!row) {
    throw new Error("Settings not found.");
  }
  return row;
}

/**
 * Persists a full settings update and returns the saved record.
 */
export async function updateSettings(
  data: ShopSettings,
): Promise<ShopSettings> {
  await simulateLatency();
  
  // Get the single ID first
  const currentResult = await supabase.from("settings").select("id").limit(1);
  const currentRow = firstOrNull(assertNoError(currentResult, "updateSettings") as { id: string }[]);
  
  if (!currentRow) {
    throw new Error("Settings row not found to update.");
  }

  const result = await supabase
    .from("settings")
    .update(data)
    .eq("id", currentRow.id)
    .select(SETTINGS_COLUMNS)
    .single();
    
  return assertNoError(result, "updateSettings") as ShopSettings;
}
