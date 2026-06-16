"use server";

import type { Manufacturer } from "../models/Manufacturer";
import { readData, writeData } from "../db";
import { generateId } from "../generateId";
import { simulateLatency } from "./delay";

const FILE_NAME = "manufacturers.json";

export async function getManufacturers(): Promise<Manufacturer[]> {
  await simulateLatency();
  return readData<Manufacturer[]>(FILE_NAME);
}

export async function createManufacturer(name: string): Promise<Manufacturer> {
  await simulateLatency();
  const newManufacturer: Manufacturer = {
    id: generateId(),
    name,
  };
  const manufacturers = await readData<Manufacturer[]>(FILE_NAME);
  manufacturers.push(newManufacturer);
  await writeData(FILE_NAME, manufacturers);
  return newManufacturer;
}

export async function deleteManufacturer(id: string): Promise<void> {
  await simulateLatency();
  const manufacturers = await readData<Manufacturer[]>(FILE_NAME);
  const updated = manufacturers.filter((m) => m.id !== id);
  await writeData(FILE_NAME, updated);
}
