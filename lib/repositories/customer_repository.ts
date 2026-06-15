"use server";

import type { Customer } from "../models/Customer";
import { readData, writeData } from "../db";
import { generateId } from "../generateId";
import { simulateLatency } from "./delay";

const FILE_NAME = "customers.json";

/**
 * Returns all customers.
 */
export async function getCustomers(): Promise<Customer[]> {
  await simulateLatency();
  return readData<Customer[]>(FILE_NAME);
}

/**
 * Returns a single customer by id, or null if no match is found.
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  await simulateLatency();
  const customers = await readData<Customer[]>(FILE_NAME);
  return customers.find((customer) => customer.id === id) ?? null;
}

/**
 * Creates a new customer, persists it to the JSON file, and returns it.
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

  const customers = await readData<Customer[]>(FILE_NAME);
  customers.push(customer);
  await writeData(FILE_NAME, customers);

  return customer;
}
