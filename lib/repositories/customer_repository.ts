"use server";

import type { Customer } from "../models/Customer";
import type { Vehicle } from "../models/Vehicle";
import type { JobCard } from "../models/JobCard";
import { normalizeJobStatus } from "../models/JobCard";
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

export interface CustomerListWithLTV {
  customer: Customer;
  ltv: number;
}

export async function getCustomersListWithLTV(): Promise<CustomerListWithLTV[]> {
  await simulateLatency();

  const customers = await readData<Customer[]>(FILE_NAME);
  const jobs = await readData<JobCard[]>("jobs.json");

  // Group jobs by customer to compute LTV efficiently
  const ltvMap = new Map<string, number>();
  for (const job of jobs) {
    if (normalizeJobStatus(job.status) === "Completed" || normalizeJobStatus(job.status) === "Closed") {
      const current = ltvMap.get(job.customer_id) ?? 0;
      ltvMap.set(job.customer_id, current + job.total_amount);
    }
  }

  return customers.map((customer) => ({
    customer,
    ltv: ltvMap.get(customer.id) ?? 0,
  }));
}

export interface Customer360 {
  customer: Customer;
  vehicles: Vehicle[];
  jobs: JobCard[];
  ltv: number;
}

export async function getCustomer360(customerId: string): Promise<Customer360 | null> {
  await simulateLatency();

  const customers = await readData<Customer[]>(FILE_NAME);
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) return null;

  const vehicles = await readData<Vehicle[]>("vehicles.json");
  const customerVehicles = vehicles.filter((v) => v.customer_id === customerId);

  const jobs = await readData<JobCard[]>("jobs.json");
  const customerJobs = jobs.filter((j) => j.customer_id === customerId);

  const ltv = customerJobs.reduce((sum, job) => {
    if (normalizeJobStatus(job.status) === "Completed" || normalizeJobStatus(job.status) === "Closed") {
      return sum + job.total_amount;
    }
    return sum;
  }, 0);

  return {
    customer,
    vehicles: customerVehicles,
    jobs: customerJobs,
    ltv,
  };
}
