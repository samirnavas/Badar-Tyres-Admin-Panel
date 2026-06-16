"use server";

import type { User } from "../models/User";
import { readData, writeData } from "../db";
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

export async function createUser(data: Omit<User, "id">): Promise<User> {
  await simulateLatency();
  const newUser: User = { ...data, id: `usr_${Date.now()}` };
  const users = await readData<User[]>(FILE_NAME);
  users.push(newUser);
  await writeData(FILE_NAME, users);
  return newUser;
}

export async function updateUserRole(id: string, newRole: User["role"]): Promise<User | null> {
  await simulateLatency();
  const users = await readData<User[]>(FILE_NAME);
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) return null;
  users[userIndex].role = newRole;
  await writeData(FILE_NAME, users);
  return users[userIndex];
}

export async function deleteUser(id: string): Promise<void> {
  await simulateLatency();
  const users = await readData<User[]>(FILE_NAME);
  const filtered = users.filter((u) => u.id !== id);
  await writeData(FILE_NAME, filtered);
}
