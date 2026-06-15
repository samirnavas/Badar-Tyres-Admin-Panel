import type { User } from "../models/User";
import { mockUsers } from "../mock_db";
import { simulateLatency } from "./delay";

/**
 * Returns all users.
 */
export async function getUsers(): Promise<User[]> {
  await simulateLatency();
  return [...mockUsers];
}

/**
 * Returns a single user by id, or null if no match is found.
 */
export async function getUserById(id: string): Promise<User | null> {
  await simulateLatency();
  return mockUsers.find((user) => user.id === id) ?? null;
}

/**
 * Returns only users with the technician role — used to populate the
 * "assigned technician" selector on job cards.
 */
export async function getTechnicians(): Promise<User[]> {
  await simulateLatency();
  return mockUsers.filter((user) => user.role === "technician");
}
