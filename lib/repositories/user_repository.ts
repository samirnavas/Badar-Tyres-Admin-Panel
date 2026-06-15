"use server";

import type { User } from "../models/User";
import { readData } from "../db";
import { simulateLatency } from "./delay";

const FILE_NAME = "users.json";

/**
 * Returns all users.
 */
export async function getUsers(): Promise<User[]> {
  await simulateLatency();
  return readData<User[]>(FILE_NAME);
}

/**
 * Returns a single user by id, or null if no match is found.
 */
export async function getUserById(id: string): Promise<User | null> {
  await simulateLatency();
  const users = await readData<User[]>(FILE_NAME);
  return users.find((user) => user.id === id) ?? null;
}

/**
 * Returns only users with the technician role — used to populate the
 * "assigned technician" selector on job cards.
 */
export async function getTechnicians(): Promise<User[]> {
  await simulateLatency();
  const users = await readData<User[]>(FILE_NAME);
  return users.filter((user) => user.role === "technician");
}
