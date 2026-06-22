"use server";

import type { Bay, BayStatus } from "../models/Bay";
import { assertNoError, firstOrNull } from "../database/helpers";
import { bayFromRow, bayToRow, type BayRow } from "../database/mappers";
import { generateId } from "../generateId";
import { supabase } from "../supabase";
import { simulateLatency } from "./delay";

class BayRepository {
  async getBays(): Promise<Bay[]> {
    await simulateLatency();
    const result = await supabase.from("bays").select("*").order("name");
    const rows = assertNoError(result, "getBays") as BayRow[];
    return (rows ?? []).map(bayFromRow);
  }

  async getBayById(id: string): Promise<Bay | null> {
    await simulateLatency();
    const result = await supabase.from("bays").select("*").eq("id", id).limit(1);
    const row = firstOrNull(assertNoError(result, "getBayById") as BayRow[]);
    return row ? bayFromRow(row) : null;
  }

  async getOpenBays(): Promise<Bay[]> {
    await simulateLatency();
    const result = await supabase.from("bays").select("*").eq("status", "Open").order("name");
    const rows = assertNoError(result, "getOpenBays") as BayRow[];
    return (rows ?? []).map(bayFromRow);
  }

  async createBay(data: Omit<Bay, "id">): Promise<Bay> {
    await simulateLatency();

    const bay: Bay = { ...data, id: generateId() };
    const result = await supabase
      .from("bays")
      .insert(bayToRow(bay))
      .select("*")
      .single();
    return bayFromRow(assertNoError(result, "createBay") as BayRow);
  }

  async updateBay(id: string, data: Partial<Omit<Bay, "id">>): Promise<Bay> {
    await simulateLatency();

    const existing = await this.getBayById(id);
    if (!existing) {
      throw new Error("Bay not found");
    }

    const updatedBay = { ...existing, ...data };
    const result = await supabase
      .from("bays")
      .update(bayToRow(updatedBay))
      .eq("id", id)
      .select("*")
      .single();
    return bayFromRow(assertNoError(result, "updateBay") as BayRow);
  }

  async deleteBay(id: string): Promise<void> {
    await simulateLatency();
    const result = await supabase.from("bays").delete().eq("id", id);
    assertNoError(result, "deleteBay");
  }

  async setBayStatus(id: string, status: BayStatus): Promise<Bay> {
    return this.updateBay(id, { status });
  }
}

const bayRepository = new BayRepository();

export async function getBays(): Promise<Bay[]> {
  return bayRepository.getBays();
}

export async function getBayById(id: string): Promise<Bay | null> {
  return bayRepository.getBayById(id);
}

export async function getOpenBays(): Promise<Bay[]> {
  return bayRepository.getOpenBays();
}

export async function createBay(data: Omit<Bay, "id">): Promise<Bay> {
  return bayRepository.createBay(data);
}

export async function updateBay(
  id: string,
  data: Partial<Omit<Bay, "id">>,
): Promise<Bay> {
  return bayRepository.updateBay(id, data);
}

export async function deleteBay(id: string): Promise<void> {
  return bayRepository.deleteBay(id);
}

export async function setBayStatus(
  id: string,
  status: BayStatus,
): Promise<Bay> {
  return bayRepository.setBayStatus(id, status);
}
