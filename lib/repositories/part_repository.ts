"use server";

import type { Part, PartInput } from "../models/Part";
import { readData, writeData } from "../db";
import { generateId } from "../generateId";
import { simulateLatency } from "./delay";

const FILE_NAME = "parts.json";

class PartRepository {
  async getParts(): Promise<Part[]> {
    await simulateLatency();
    return readData<Part[]>(FILE_NAME);
  }

  async getPartById(id: string): Promise<Part | null> {
    await simulateLatency();
    const parts = await readData<Part[]>(FILE_NAME);
    return parts.find((part) => part.id === id) ?? null;
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

    const parts = await readData<Part[]>(FILE_NAME);
    parts.unshift(part);
    await writeData(FILE_NAME, parts);

    return part;
  }

  async updatePart(id: string, data: Partial<PartInput>): Promise<Part> {
    await simulateLatency();

    const parts = await readData<Part[]>(FILE_NAME);
    const index = parts.findIndex((part) => part.id === id);
    if (index === -1) {
      throw new Error("Part not found");
    }

    const updatedPart: Part = {
      ...parts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    parts[index] = updatedPart;
    await writeData(FILE_NAME, parts);

    return updatedPart;
  }

  async deletePart(id: string): Promise<void> {
    await simulateLatency();

    const parts = await readData<Part[]>(FILE_NAME);
    const updated = parts.filter((part) => part.id !== id);
    await writeData(FILE_NAME, updated);
  }

  async getLowStockParts(): Promise<Part[]> {
    await simulateLatency();
    const parts = await readData<Part[]>(FILE_NAME);
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
