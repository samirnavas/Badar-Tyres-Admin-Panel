"use server";

import type { Part, PartInput } from "../models/Part";
import { assertNoError, firstOrNull } from "../database/helpers";
import { partFromRow, partToRow, type PartRow } from "../database/mappers";
import { generateId } from "../generateId";
import { supabase } from "../supabase";
import { simulateLatency } from "./delay";

class PartRepository {
  async getParts(): Promise<Part[]> {
    await simulateLatency();
    const result = await supabase.from("parts").select("*").order("name");
    const rows = assertNoError(result, "getParts") as PartRow[];
    return (rows ?? []).map(partFromRow);
  }

  async getPartById(id: string): Promise<Part | null> {
    await simulateLatency();
    const result = await supabase.from("parts").select("*").eq("id", id).limit(1);
    const row = firstOrNull(assertNoError(result, "getPartById") as PartRow[]);
    return row ? partFromRow(row) : null;
  }

  async createPart(data: PartInput): Promise<Part> {
    await simulateLatency();

    const now = new Date().toISOString();
    const part: Part = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await supabase
      .from("parts")
      .insert(partToRow(part))
      .select("*")
      .single();
    return partFromRow(assertNoError(result, "createPart") as PartRow);
  }

  async updatePart(id: string, data: Partial<PartInput>): Promise<Part> {
    await simulateLatency();

    const existing = await this.getPartById(id);
    if (!existing) {
      throw new Error("Part not found");
    }

    const updatedPart: Part = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const result = await supabase
      .from("parts")
      .update(partToRow(updatedPart))
      .eq("id", id)
      .select("*")
      .single();
    return partFromRow(assertNoError(result, "updatePart") as PartRow);
  }

  async deletePart(id: string): Promise<void> {
    await simulateLatency();
    const result = await supabase.from("parts").delete().eq("id", id);
    assertNoError(result, "deletePart");
  }

  async getLowStockParts(): Promise<Part[]> {
    await simulateLatency();
    const parts = await this.getParts();
    return parts.filter((part) => part.stockLevel <= part.minStockThreshold);
  }
}

const partRepository = new PartRepository();

export async function getParts(): Promise<Part[]> {
  return partRepository.getParts();
}

export async function getPartById(id: string): Promise<Part | null> {
  return partRepository.getPartById(id);
}

export async function createPart(data: PartInput): Promise<Part> {
  return partRepository.createPart(data);
}

export async function updatePart(
  id: string,
  data: Partial<PartInput>,
): Promise<Part> {
  return partRepository.updatePart(id, data);
}

export async function deletePart(id: string): Promise<void> {
  return partRepository.deletePart(id);
}

export async function getLowStockParts(): Promise<Part[]> {
  return partRepository.getLowStockParts();
}
