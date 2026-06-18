"use server";

import type { Bay, BayStatus } from "../models/Bay";
import { readData, writeData } from "../db";
import { generateId } from "../generateId";
import { simulateLatency } from "./delay";

const FILE_NAME = "bays.json";

class BayRepository {
  async getBays(): Promise<Bay[]> {
    await simulateLatency();
    return readData<Bay[]>(FILE_NAME);
  }

  async getBayById(id: string): Promise<Bay | null> {
    await simulateLatency();
    const bays = await readData<Bay[]>(FILE_NAME);
    return bays.find((bay) => bay.id === id) ?? null;
  }

  async getOpenBays(): Promise<Bay[]> {
    await simulateLatency();
    const bays = await readData<Bay[]>(FILE_NAME);
    return bays.filter((bay) => bay.status === "Open");
  }

  async createBay(data: Omit<Bay, "id">): Promise<Bay> {
    await simulateLatency();

    const bay: Bay = { ...data, id: generateId() };
    const bays = await readData<Bay[]>(FILE_NAME);
    bays.push(bay);
    await writeData(FILE_NAME, bays);

    return bay;
  }

  async updateBay(id: string, data: Partial<Omit<Bay, "id">>): Promise<Bay> {
    await simulateLatency();

    const bays = await readData<Bay[]>(FILE_NAME);
    const index = bays.findIndex((bay) => bay.id === id);
    if (index === -1) {
      throw new Error("Bay not found");
    }

    const updatedBay = { ...bays[index], ...data };
    bays[index] = updatedBay;
    await writeData(FILE_NAME, bays);

    return updatedBay;
  }

  async deleteBay(id: string): Promise<void> {
    await simulateLatency();

    const bays = await readData<Bay[]>(FILE_NAME);
    const updated = bays.filter((bay) => bay.id !== id);
    await writeData(FILE_NAME, updated);
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
