"use server";

import type { User } from "../models/User";
import { getTechnicians as getTechniciansFromUsers, getUserById } from "./user_repository";
import { simulateLatency } from "./delay";

/**
 * Returns all technicians available for job assignment.
 */
export async function getTechnicians(): Promise<User[]> {
  return getTechniciansFromUsers();
}

/**
 * Returns a single technician by id, or null if not found or not a technician.
 */
export async function getTechnicianById(id: string): Promise<User | null> {
  await simulateLatency();
  const user = await getUserById(id);
  if (!user || user.role !== "Technician") return null;
  return user;
}
