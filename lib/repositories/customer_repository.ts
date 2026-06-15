import type { Customer } from "../models/Customer";
import { mockCustomers } from "../mock_db";
import { generateId } from "../generateId";
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

/**
 * Simulates creating a new customer: generates a mock UUID, stamps
 * created_at with the current time, persists it to the mock array, and
 * returns the saved record.
 */
export async function createCustomer(
  data: Omit<Customer, "id" | "created_at">,
): Promise<Customer> {
  await simulateLatency();

  const customer: Customer = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  mockCustomers.push(customer);
  return customer;
}
