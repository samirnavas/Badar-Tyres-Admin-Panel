"use server";

import type { ShopSettings } from "../models/ShopSettings";
import { simulateLatency } from "./delay";
import { supabase } from "../supabase";
import { assertNoError, firstOrNull } from "../database/helpers";
import { getSupabaseServerConfigError } from "../supabase-config";

const SETTINGS_COLUMNS =
  "shop_name, shop_address, contact_phone, contact_email, default_gst_rate, terms_and_conditions";

export const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: "Badar Tyres & Auto Car",
  shop_address: "Wayanad Road Koduvally, Kozhikode",
  contact_phone: "+91 9188954101",
  contact_email: "info@badartyres.com",
  default_gst_rate: 16,
  terms_and_conditions: "This is the terms and conditions.",
};

export type SettingsUpdateResult =
  | { ok: true; data: ShopSettings }
  | { ok: false; error: string };

async function seedDefaultSettings(): Promise<ShopSettings | null> {
  const result = await supabase
    .from("settings")
    .insert(DEFAULT_SETTINGS)
    .select(SETTINGS_COLUMNS)
    .single();

  if (result.error || !result.data) {
    console.error("[getSettings] Failed to seed default settings:", result.error);
    return null;
  }

  return result.data as ShopSettings;
}

/**
 * Returns the shop's global settings from Supabase.
 * Falls back to defaults when the row is missing or the database is unavailable.
 */
export async function getSettings(): Promise<ShopSettings> {
  const configError = getSupabaseServerConfigError();
  if (configError) {
    console.error("[getSettings]", configError);
    return DEFAULT_SETTINGS;
  }

  try {
    await simulateLatency();
    const result = await supabase
      .from("settings")
      .select(SETTINGS_COLUMNS)
      .limit(1);

    const row = firstOrNull(assertNoError(result, "getSettings") as ShopSettings[]);
    if (row) {
      return row;
    }

    const seeded = await seedDefaultSettings();
    return seeded ?? DEFAULT_SETTINGS;
  } catch (error) {
    console.error("[getSettings]", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Persists a full settings update and returns the saved record.
 */
export async function updateSettings(
  data: ShopSettings,
): Promise<SettingsUpdateResult> {
  const configError = getSupabaseServerConfigError();
  if (configError) {
    console.error("[updateSettings]", configError);
    return { ok: false, error: configError };
  }

  try {
    await simulateLatency();

    const currentResult = await supabase.from("settings").select("id").limit(1);
    let targetRow = firstOrNull(
      assertNoError(currentResult, "updateSettings") as { id: string }[],
    );

    if (!targetRow) {
      await seedDefaultSettings();
      const targetResult = await supabase.from("settings").select("id").limit(1);
      targetRow = firstOrNull(
        assertNoError(targetResult, "updateSettings") as { id: string }[],
      );
    }

    if (!targetRow) {
      return { ok: false, error: "Settings row not found to update." };
    }

    const result = await supabase
      .from("settings")
      .update(data)
      .eq("id", targetRow.id)
      .select(SETTINGS_COLUMNS)
      .single();

    return {
      ok: true,
      data: assertNoError(result, "updateSettings") as ShopSettings,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save settings.";
    console.error("[updateSettings]", error);
    return { ok: false, error: message };
  }
}
