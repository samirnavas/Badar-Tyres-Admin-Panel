"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, ShieldCheck } from "lucide-react";
import { getJobCards, getCustomers, getVehicles, getTechnicians } from "@/lib/repositories";
import type { JobCard } from "@/lib/models/JobCard";
import { normalizeJobStatus, getJobTechnicianId } from "@/lib/models/JobCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { cn, formatCurrency, formatDate, isWarrantyActive } from "@/lib/format";

type PipelineFilter = "all" | "estimates" | "active" | "completed";

const tabs: { value: PipelineFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "estimates", label: "Estimates" },
  { value: "active", label: "Active Jobs" },
  { value: "completed", label: "Completed" },
];

function matchesPipelineFilter(
  status: JobCard["status"] | string,
  filter: PipelineFilter,
): boolean {
  const normalized = normalizeJobStatus(status);

  switch (filter) {
    case "estimates":
      return normalized === "Estimate";
    case "active":
      return normalized === "Approved" || normalized === "In Progress";
    case "completed":
      return normalized === "Completed" || normalized === "Cancelled";
    default:
      return true;
  }
}

interface JobRow extends JobCard {
  customerName: string;
  vehicleModel: string;
  vehicleRegistration: string;
  technicianName: string;
  warrantyActive: boolean;
}

export default function JobsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<PipelineFilter>("all");
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all");

  const jobsQuery = useQuery({ queryKey: ["job-cards"], queryFn: getJobCards });
  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });
  const techniciansQuery = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });

  const technicianOptions: ComboboxOption[] = useMemo(() => {
    const defaultOption = { value: "all", label: "All Technicians" };
    if (!techniciansQuery.data) return [defaultOption];
    return [
      defaultOption,
      ...techniciansQuery.data.map((t) => ({
        value: t.id,
        label: t.name,
      })),
    ];
  }, [techniciansQuery.data]);

  const isLoading =
    jobsQuery.isLoading || customersQuery.isLoading || vehiclesQuery.isLoading || techniciansQuery.isLoading;
  const isError =
    jobsQuery.isError || customersQuery.isError || vehiclesQuery.isError || techniciansQuery.isError;

  const rows: JobRow[] = useMemo(() => {
    const customerMap = new Map(
      (customersQuery.data ?? []).map((c) => [c.id, c]),
    );
    const vehicleMap = new Map((vehiclesQuery.data ?? []).map((v) => [v.id, v]));
    const technicianMap = new Map(
      (techniciansQuery.data ?? []).map((t) => [t.id, t]),
    );

    return (jobsQuery.data ?? [])
      .filter((job) => matchesPipelineFilter(job.status, tab))
      .filter(
        (job) =>
          selectedTechnician === "all" ||
          getJobTechnicianId(job) === selectedTechnician,
      )
      .map((job) => {
        const vehicle = vehicleMap.get(job.vehicle_id);
        return {
          ...job,
          customerName: customerMap.get(job.customer_id)?.name ?? "Unknown",
          vehicleModel: vehicle
            ? `${vehicle.manufacturer} ${vehicle.model}`
            : "—",
          vehicleRegistration: vehicle ? vehicle.registration_number : "—",
          technicianName:
            technicianMap.get(getJobTechnicianId(job) ?? "")?.name ?? "Unassigned",
          warrantyActive: isWarrantyActive(job.warranty_end_date),
        };
      });
  }, [
    jobsQuery.data,
    customersQuery.data,
    vehiclesQuery.data,
    techniciansQuery.data,
    tab,
    selectedTechnician,
  ]);

  const goToJob = (id: string) => router.push(`/jobs/${id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Job Cards
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage estimates and active workshop jobs across all bays.
          </p>
        </div>
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
        >
          <Plus className="h-4 w-4" /> New Estimate
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors",
                tab === t.value
                  ? "border-theme-accent bg-theme-accent text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Technician:
          </label>
          <div className="w-48">
            <Combobox
              options={technicianOptions}
              value={selectedTechnician}
              onChange={(value) => setSelectedTechnician(value || "all")}
              placeholder={techniciansQuery.isLoading ? "Loading..." : "Select technician..."}
              disabled={techniciansQuery.isLoading}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Desktop table */}
        <div className="hidden md:block w-full overflow-auto max-h-[calc(100vh-200px)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur shadow-[0_1px_0_rgba(0,0,0,0.1)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr className="border-b border-gray-200 text-left">
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Reg. No</th>
                <th className="px-3 py-2">Technician</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-3 py-2">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                !isError &&
                rows.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => goToJob(job.id)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        {job.customerName}
                        {job.warrantyActive && (
                          <ShieldCheck
                            className="h-4 w-4 text-emerald-600"
                            aria-label="Active warranty"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {job.vehicleModel}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {job.vehicleRegistration}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {job.technicianName}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900 tabular-nums">
                      ₹ {formatCurrency(job.total_amount)}
                    </td>
                  </tr>
                ))}

              {!isLoading && isError && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-theme-accent"
                  >
                    Failed to load job cards.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No job cards match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="block md:hidden divide-y divide-gray-100">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5">
                <Skeleton className="h-24 w-full" />
              </div>
            ))}

          {!isLoading &&
            !isError &&
            rows.map((job) => (
              <button
                key={job.id}
                onClick={() => goToJob(job.id)}
                className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {job.customerName}
                    </span>
                    {job.warrantyActive && (
                      <ShieldCheck
                        className="h-4 w-4 text-emerald-600"
                        aria-label="Active warranty"
                      />
                    )}
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-400">Vehicle</div>
                    <div className="text-gray-900">{job.vehicleModel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Reg. No</div>
                    <div className="text-gray-900">{job.vehicleRegistration}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Technician</div>
                    <div className="text-gray-900">{job.technicianName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Created</div>
                    <div className="text-gray-900">
                      {formatDate(job.created_at)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-gray-400">Total</div>
                    <div className="font-semibold text-gray-900 tabular-nums">
                      ₹ {formatCurrency(job.total_amount)}
                    </div>
                  </div>
                </div>
              </button>
            ))}

          {!isLoading && isError && (
            <div className="p-12 text-center text-sm text-theme-accent">
              Failed to load job cards.
            </div>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <div className="p-12 text-center text-sm text-gray-500">
              No job cards match this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
