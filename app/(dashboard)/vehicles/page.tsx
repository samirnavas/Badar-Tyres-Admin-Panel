export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { cn } from "@/lib/format";
import { getVehicles, getCustomers, getJobCards } from "@/lib/repositories";
import type { Vehicle } from "@/lib/models/Vehicle";
import type { JobCard } from "@/lib/models/JobCard";
import type { Customer } from "@/lib/models/Customer";

export default async function VehiclesPage() {
  const [vehicles, customers, jobs] = await Promise.all([
    getVehicles(),
    getCustomers(),
    getJobCards()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Active Customer &amp; Vehicle Fleet Catalog
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive overview of registered operational assets and service
            history.
          </p>
        </div>
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-2 rounded-md bg-theme-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
        >
          <Plus className="h-4 w-4" /> Instantly Initialize New Job Card Workflow
        </Link>
      </div>

      <div className="space-y-4">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            customer={customers.find((c) => c.id === vehicle.customer_id) || null}
            jobs={jobs.filter((j) => j.vehicle_id === vehicle.id)}
          />
        ))}

        {vehicles.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
            No registered vehicles yet.
          </div>
        )}
      </div>

      {vehicles.length > 0 && (
        <div className="flex justify-center pt-2">
          <button className="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 transition-colors hover:bg-gray-50">
            Load Additional Records
          </button>
        </div>
      )}
    </div>
  );
}

function VehicleCard({
  vehicle,
  customer,
  jobs,
}: {
  vehicle: Vehicle;
  customer: Customer | null;
  jobs: JobCard[];
}) {
  const jobCount = jobs.length;
  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latest = sortedJobs[0];
  
  const isServiceOverdue =
    vehicle.next_service_date && new Date(vehicle.next_service_date) < new Date();
  const serviceDue =
    latest?.status === "Draft" || latest?.status === "In Progress" || isServiceOverdue;

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 md:grid-cols-[260px_1fr_minmax(220px,1fr)]">
      {/* License plate */}
      <div className="flex flex-col justify-between bg-white p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            License Plate
          </p>
          <div className="mt-2 inline-block rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-xl font-bold tracking-wider text-theme-accent">
            {vehicle.registration_number}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              serviceDue ? "bg-amber-500" : "bg-emerald-500",
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
            {serviceDue ? "Service Due" : "Active Status"}
          </span>
        </div>
      </div>

      {/* Vehicle metadata */}
      <div className="bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Vehicle Overview
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Meta label="Make" value={vehicle.manufacturer || "—"} />
          <Meta label="Model" value={vehicle.model || "—"} />
          <Meta label="Owner" value={customer?.name || "—"} />
        </dl>
      </div>

      {/* Maintenance frequency */}
      <div className="flex flex-col justify-between bg-white p-5">
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Maintenance History
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {jobCount}
            <span className="ml-1 text-xs font-medium text-gray-500">
              Jobs
            </span>
          </p>
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              serviceDue ? "text-theme-accent" : "text-gray-500",
            )}
          >
            Last seen: {latest ? new Date(latest.created_at).toLocaleDateString() : "—"}
          </p>
        </div>
        <Link
          href={
            latest
              ? `/jobs/${latest.id}`
              : `/jobs?search=${encodeURIComponent(vehicle.registration_number)}`
          }
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Eye className="h-3.5 w-3.5" /> View Full Profile
        </Link>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
