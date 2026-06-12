"use client";

import Link from "next/link";
import { Plus, Mail, Phone, Eye } from "lucide-react";
import { useVehicles, useJobs } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/format";
import type { Job, Vehicle } from "@/lib/types";

export default function VehiclesPage() {
  const vehicles = useVehicles();
  const jobs = useJobs();

  const allJobs = jobs.data ?? [];

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
        {vehicles.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}

        {vehicles.isError && (
          <div className="rounded-md border border-theme-accent/30 bg-theme-accent-soft px-5 py-10 text-center text-sm font-medium text-theme-accent">
            {(vehicles.error as Error)?.message ??
              "Failed to load fleet catalog. Is the API running?"}
          </div>
        )}

        {!vehicles.isLoading &&
          !vehicles.isError &&
          (vehicles.data ?? []).map((vehicle) => (
            <VehicleCard
              key={vehicle.vehicleNumber}
              vehicle={vehicle}
              jobs={allJobs}
            />
          ))}

        {!vehicles.isLoading &&
          !vehicles.isError &&
          (vehicles.data ?? []).length === 0 && (
            <div className="rounded-md border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
              No registered vehicles yet.
            </div>
          )}
      </div>

      {!vehicles.isLoading && (vehicles.data ?? []).length > 0 && (
        <div className="flex justify-center pt-2">
          <button className="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 transition-colors hover:bg-gray-50">
            Load Additional Records
          </button>
        </div>
      )}
    </div>
  );
}

function VehicleCard({ vehicle, jobs }: { vehicle: Vehicle; jobs: Job[] }) {
  const vehicleJobs = jobs.filter(
    (j) => j.vehicleNumber === vehicle.vehicleNumber,
  );
  const jobCount = vehicleJobs.length;
  const latest = vehicleJobs[0];
  const serviceDue =
    latest?.status === "delayed" || latest?.status === "pending";

  const slug = vehicle.customerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  const email = `${slug || "fleet"}@badartyres.ae`;

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 md:grid-cols-[260px_1fr_1fr_minmax(220px,1fr)]">
      {/* License plate */}
      <div className="flex flex-col justify-between bg-white p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            License Plate
          </p>
          <div className="mt-2 inline-block rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-xl font-bold tracking-wider text-theme-accent">
            {vehicle.vehicleNumber}
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
          Vehicle Metadata
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Meta label="Make" value={vehicle.vehicleType || "—"} />
          <Meta label="Model" value={vehicle.vehicleModel || "—"} />
          <Meta label="Customer" value={vehicle.customerName || "—"} />
          <Meta label="Last Job" value={vehicle.lastJobId || "—"} />
        </dl>
      </div>

      {/* Fleet operator */}
      <div className="bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Fleet Operator
        </p>
        <p className="mt-3 text-base font-semibold text-gray-900">
          {vehicle.customerName}
        </p>
        <div className="mt-2 space-y-1.5 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-gray-400" /> {email}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gray-400" />{" "}
            {vehicle.mobile || "—"}
          </p>
        </div>
      </div>

      {/* Maintenance frequency */}
      <div className="flex flex-col justify-between bg-white p-5">
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Maintenance Frequency
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {jobCount}
            <span className="ml-1 text-xs font-medium text-gray-500">
              Jobs / LTD
            </span>
          </p>
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              serviceDue ? "text-theme-accent" : "text-gray-500",
            )}
          >
            Last seen: {vehicle.lastJobDate || "—"}
          </p>
        </div>
        <Link
          href={vehicle.lastJobId ? `/jobs/${vehicle.lastJobId}` : `/jobs?search=${encodeURIComponent(vehicle.vehicleNumber)}`}
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
