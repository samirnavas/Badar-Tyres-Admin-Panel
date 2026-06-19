"use server";

import { readData, writeData } from "../db";
import { simulateLatency } from "./delay";

const FILE_NAME = "permissions.json";

export async function getPermissions(): Promise<Record<string, string[]>> {
  await simulateLatency();
  return readData<Record<string, string[]>>(FILE_NAME);
}

export async function updatePermissions(
  data: Record<string, string[]>,
): Promise<Record<string, string[]>> {
  await simulateLatency();
  const merged = { ...data, Admin: ["*"] };
  await writeData(FILE_NAME, merged);
  return merged;
}
