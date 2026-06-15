"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { getVehicles, getCustomers } from "@/lib/repositories";
import type { Vehicle } from "@/lib/models/Vehicle";
import type { Customer } from "@/lib/models/Customer";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, daysUntil } from "@/lib/format";

export interface UpcomingService {
  vehicle: Vehicle;
  customer: Customer | null;
  /** Whole days until next_service_date (negative when overdue). */
  days: number;
  overdue: boolean;
}

/**
 * Filters vehicles to those whose next_service_date is overdue or falls
 * within `withinDays` (default 30), joins each to its customer, and sorts
 * the result by urgency (most overdue first).
 */
export function filterUpcomingServices(
  vehicles: Vehicle[],
  customers: Customer[],
  withinDays = 30,
): UpcomingService[] {
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  return vehicles
    .map((vehicle) => {
      const days = daysUntil(vehicle.next_service_date);
      return { vehicle, days };
    })
    .filter(
      (item): item is { vehicle: Vehicle; days: number } =>
        item.days !== null && item.days <= withinDays,
    )
    .map(({ vehicle, days }) => ({
      vehicle,
      customer: customerMap.get(vehicle.customer_id) ?? null,
      days,
      overdue: days < 0,
    }))
    .sort((a, b) => a.days - b.days);
}

function timeframeLabel(item: UpcomingService): string {
  if (item.overdue) {
    const overdueBy = Math.abs(item.days);
    return `Overdue by ${overdueBy} day${overdueBy === 1 ? "" : "s"}`;
  }
  if (item.days === 0) return "Due today";
  return `Upcoming in ${item.days} day${item.days === 1 ? "" : "s"}`;
}

export function UpcomingServicesWidget() {
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });
  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const isLoading = vehiclesQuery.isLoading || customersQuery.isLoading;
  const isError = vehiclesQuery.isError || customersQuery.isError;

  const items = filterUpcomingServices(
    vehiclesQuery.data ?? [],
    customersQuery.data ?? [],
    30,
  );

  return (
    <section className="flex flex-col rounded-md border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <BellRing className="h-4 w-4 text-theme-accent" />
          Upcoming Services
        </h2>
        {!isLoading && !isError && items.length > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-theme-accent-soft px-1.5 text-[11px] font-semibold text-theme-accent">
            {items.length}
          </span>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading && (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <p className="px-5 py-10 text-center text-sm text-theme-accent">
            Failed to load upcoming services.
          </p>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            No services due in the next 30 days.
          </p>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.vehicle.id}>
                <Link
                  href={`/users?customer=${item.vehicle.customer_id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {item.customer?.name ?? "Unknown customer"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {item.vehicle.manufacturer} {item.vehicle.model}
                      <span className="text-gray-400">
                        {" · "}
                        {item.vehicle.registration_number}
                      </span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      item.overdue
                        ? "border-theme-accent/30 bg-theme-accent-soft text-theme-accent"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    )}
                  >
                    {timeframeLabel(item)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
