"use server";

import type { Customer } from "../models/Customer";
import type { Vehicle } from "../models/Vehicle";
import type { JobCard } from "../models/JobCard";
import { normalizeJobStatus } from "../models/JobCard";
import { assertNoError, firstOrNull } from "../database/helpers";
import {
  customerFromRow,
  customerToRow,
  jobFromRow,
  vehicleFromRow,
  type CustomerRow,
  type JobRow,
  type VehicleRow,
} from "../database/mappers";
import { generateId } from "../generateId";
import { supabase } from "../supabase";
import { simulateLatency } from "./delay";

/**
 * Returns all customers.
 */
export async function getCustomers(): Promise<Customer[]> {
  await simulateLatency();
  const result = await supabase
    .from("customers")
    .select("*")
    .order("first_name")
    .order("last_name");
  const rows = assertNoError(result, "getCustomers") as CustomerRow[];
  return (rows ?? []).map(customerFromRow);
}

/**
 * Returns a single customer by id, or null if no match is found.
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  await simulateLatency();
  const result = await supabase.from("customers").select("*").eq("id", id).limit(1);
  const row = firstOrNull(assertNoError(result, "getCustomerById") as CustomerRow[]);
  return row ? customerFromRow(row) : null;
}

/**
 * Creates a new customer, persists it to the database, and returns it.
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

  const result = await supabase
    .from("customers")
    .insert(customerToRow(customer))
    .select("*")
    .single();
  return customerFromRow(assertNoError(result, "createCustomer") as CustomerRow);
}

export interface CustomerListWithLTV {
  customer: Customer;
  ltv: number;
}

export async function getCustomersListWithLTV(): Promise<CustomerListWithLTV[]> {
  await simulateLatency();

  const [customersResult, jobsResult] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .order("first_name")
      .order("last_name"),
    supabase.from("jobs").select("*"),
  ]);

  const customers = (assertNoError(customersResult, "getCustomersListWithLTV") as CustomerRow[]).map(
    customerFromRow,
  );
  const jobs = (assertNoError(jobsResult, "getCustomersListWithLTV") as JobRow[]).map((row) => jobFromRow(row));

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

const VEHICLE_SELECT = "*, manufacturers!make_id(name)";

/**
 * Jobs store customer_id in line_items __meta__, not as a DB column.
 * Resolve jobs via the customer's vehicles, then keep rows whose meta matches.
 */
async function fetchJobsForCustomer(customerId: string): Promise<JobCard[]> {
  const vehiclesResult = await supabase
    .from("vehicles")
    .select("id")
    .eq("customer_id", customerId);
  const vehicleIds = (
    assertNoError(vehiclesResult, "fetchJobsForCustomer") as { id: string }[]
  ).map((row) => row.id);

  if (vehicleIds.length === 0) {
    return [];
  }

  const jobsResult = await supabase
    .from("jobs")
    .select("*")
    .in("vehicle_id", vehicleIds)
    .order("created_at", { ascending: false });

  return (assertNoError(jobsResult, "fetchJobsForCustomer") as JobRow[])
    .map((row) => jobFromRow(row))
    .filter((job) => job.customer_id === customerId || !job.customer_id);
}

export async function getCustomer360(customerId: string): Promise<Customer360 | null> {
  await simulateLatency();

  const customer = await getCustomerById(customerId);
  if (!customer) return null;

  const [vehiclesResult, customerJobs] = await Promise.all([
    supabase
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .eq("customer_id", customerId)
      .order("plate_number"),
    fetchJobsForCustomer(customerId),
  ]);

  const customerVehicles = (
    assertNoError(vehiclesResult, "getCustomer360") as VehicleRow[]
  ).map(vehicleFromRow);

  const ltv = customerJobs.reduce((sum, job) => {
    if (
      normalizeJobStatus(job.status) === "Completed" ||
      normalizeJobStatus(job.status) === "Closed"
    ) {
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
