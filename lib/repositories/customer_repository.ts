import type { Customer } from "../models/Customer";
import { mockCustomers } from "../mock_db";
import { simulateLatency } from "./delay";

/**
 * Returns all customers.
 */
export async function getCustomers(): Promise<Customer[]> {
  await simulateLatency();
  return [...mockCustomers];
}

/**
 * Returns a single customer by id, or null if no match is found.
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  await simulateLatency();
  return mockCustomers.find((customer) => customer.id === id) ?? null;
}
