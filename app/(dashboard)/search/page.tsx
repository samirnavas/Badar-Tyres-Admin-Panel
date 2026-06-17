"use client";

import { Suspense, useDeferredValue, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, Users, Truck, Loader2 } from "lucide-react";
import {
  getCustomers,
  getJobCards,
  getVehicles,
} from "@/lib/repositories";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { normalizeSearchQuery, matchesAnySearchQuery } from "@/lib/search";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("search") ?? "";
  const query = normalizeSearchQuery(rawQuery);
  const deferredQuery = useDeferredValue(query);

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });
  const jobsQuery = useQuery({
    queryKey: ["job-cards"],
    queryFn: getJobCards,
  });

  const isLoading =
    customersQuery.isLoading || vehiclesQuery.isLoading || jobsQuery.isLoading;
  const isSearching = query !== deferredQuery || (query.length > 0 && isLoading);
  const isError =
    customersQuery.isError || vehiclesQuery.isError || jobsQuery.isError;

  const { customers, vehicles, jobs } = useMemo(() => {
    if (!deferredQuery) {
      return { customers: [], vehicles: [], jobs: [] };
    }

    const customerList = customersQuery.data ?? [];
    const vehicleList = vehiclesQuery.data ?? [];
    const jobList = jobsQuery.data ?? [];

    const customerMap = new Map(customerList.map((c) => [c.id, c]));
    const vehicleMap = new Map(vehicleList.map((v) => [v.id, v]));

    const matchedCustomers = customerList.filter((customer) =>
      matchesAnySearchQuery(
        [
          customer.name,
          customer.phone,
          customer.email,
          customer.gst_number,
          customer.address,
        ],
        deferredQuery,
      ),
    );

    const matchedVehicles = vehicleList.filter((vehicle) => {
      const owner = customerMap.get(vehicle.customer_id);
      return matchesAnySearchQuery(
        [
          vehicle.registration_number,
          vehicle.manufacturer,
          vehicle.model,
          vehicle.chassis_number,
          vehicle.engine_number,
          vehicle.color,
          owner?.name,
          owner?.phone,
        ],
        deferredQuery,
      );
    });

    const matchedJobs = jobList.filter((job) => {
      const customer = customerMap.get(job.customer_id);
      const vehicle = vehicleMap.get(job.vehicle_id);
      const serviceNames =
        job.service_items?.map((item) => item.name).join(" ") ?? "";

      return matchesAnySearchQuery(
        [
          customer?.name,
          customer?.phone,
          customer?.email,
          vehicle?.registration_number,
          vehicle?.manufacturer,
          vehicle?.model,
          job.status,
          serviceNames,
          job.id,
        ],
        deferredQuery,
      );
    });

    return {
      customers: matchedCustomers,
      vehicles: matchedVehicles,
      jobs: matchedJobs,
    };
  }, [
    deferredQuery,
    customersQuery.data,
    vehiclesQuery.data,
    jobsQuery.data,
  ]);

  const totalResults = customers.length + vehicles.length + jobs.length;

  if (!query) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Search
        </h1>
        <p className="text-sm text-gray-500">
          Use the search bar above to find job cards, customers, or vehicles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Search Results
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isSearching
            ? `Searching for "${rawQuery.trim()}"…`
            : totalResults === 0
              ? `No results for "${rawQuery.trim()}"`
              : `${totalResults} result${totalResults === 1 ? "" : "s"} for "${rawQuery.trim()}"`}
        </p>
      </div>

      {isSearching && <SearchLoadingState query={rawQuery.trim()} />}

      {!isSearching && isError && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-theme-accent">
          Failed to load search results.
        </div>
      )}

      {!isSearching && !isError && totalResults === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Try a customer name, phone number, registration plate, or job status.
        </div>
      )}

      {!isSearching && !isError && customers.length > 0 && (
        <ResultSection
          title="Customers"
          icon={Users}
          count={customers.length}
        >
          <div className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/users/${customer.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </div>
                {customer.customer_type && (
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {customer.customer_type}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </ResultSection>
      )}

      {!isSearching && !isError && vehicles.length > 0 && (
        <ResultSection
          title="Vehicles"
          icon={Truck}
          count={vehicles.length}
        >
          <div className="divide-y divide-gray-100">
            {vehicles.map((vehicle) => {
              const owner = (customersQuery.data ?? []).find(
                (c) => c.id === vehicle.customer_id,
              );
              return (
                <Link
                  key={vehicle.id}
                  href={`/vehicles/${vehicle.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {vehicle.registration_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {vehicle.manufacturer} {vehicle.model}
                      {owner ? ` · ${owner.name}` : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </ResultSection>
      )}

      {!isSearching && !isError && jobs.length > 0 && (
        <ResultSection
          title="Job Cards"
          icon={FileText}
          count={jobs.length}
        >
          <div className="divide-y divide-gray-100">
            {jobs.map((job) => {
              const customer = (customersQuery.data ?? []).find(
                (c) => c.id === job.customer_id,
              );
              const vehicle = (vehiclesQuery.data ?? []).find(
                (v) => v.id === job.vehicle_id,
              );
              const primaryService =
                job.service_items?.[0]?.name ?? "Service";

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {customer?.name ?? "Unknown customer"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {primaryService}
                      {vehicle
                        ? ` · ${vehicle.registration_number}`
                        : ""}
                      {" · "}
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={job.status} />
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      ₹ {formatCurrency(job.total_amount)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof Users;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        <Icon className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-400">({count})</span>
      </div>
      {children}
    </section>
  );
}

function SearchLoadingState({ query }: { query: string }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-theme-accent" />
        <p className="mt-4 text-sm font-medium text-gray-900">Searching…</p>
        {query && (
          <p className="mt-1 text-sm text-gray-500">
            Looking for matches across customers, vehicles, and job cards
          </p>
        )}
      </div>

      <div className="space-y-4">
        {["Customers", "Vehicles", "Job Cards"].map((label, index) => (
          <div
            key={label}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-[80%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <Skeleton className="mb-3 h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
