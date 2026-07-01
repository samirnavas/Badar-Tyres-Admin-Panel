"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, ArrowUpDown, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";
import type { Vehicle } from "@/lib/models/Vehicle";
import type { Customer } from "@/lib/models/Customer";
import type { JobCard } from "@/lib/models/JobCard";
import { normalizeJobStatus } from "@/lib/models/JobCard";

export function VehiclesTable({
  vehicles,
  customers,
  jobs,
}: {
  vehicles: Vehicle[];
  customers: Customer[];
  jobs: JobCard[];
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "service-due">("all");
  const [sortBy, setSortBy] = useState<"newest" | "most-jobs" | "latest-job">("newest");

  const processedVehicles = useMemo(() => {
    return vehicles
      .map((vehicle) => {
        const customer = customers.find((c) => c.id === vehicle.customer_id);
        const vehicleJobs = jobs.filter((j) => j.vehicle_id === vehicle.id);
        const sortedJobs = [...vehicleJobs].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latest = sortedJobs[0];

        const isServiceOverdue =
          vehicle.next_service_date && new Date(vehicle.next_service_date) < new Date();
        const serviceDue =
          normalizeJobStatus(latest?.status ?? "") === "Estimate" ||
          normalizeJobStatus(latest?.status ?? "") === "Approved" ||
          normalizeJobStatus(latest?.status ?? "") === "In Progress" ||
          isServiceOverdue;

        return {
          ...vehicle,
          customerName: customer?.name || "",
          jobsCount: vehicleJobs.length,
          latestJobDate: latest ? new Date(latest.created_at).getTime() : 0,
          serviceDue,
        };
      })
      .filter((v) => {
        // Status Filter
        if (statusFilter === "active" && v.serviceDue) return false;
        if (statusFilter === "service-due" && !v.serviceDue) return false;

        // Search Filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchReg = v.registration_number.toLowerCase().includes(q);
          const matchMakeModel = `${v.manufacturer} ${v.model}`.toLowerCase().includes(q);
          const matchOwner = v.customerName.toLowerCase().includes(q);
          if (!matchReg && !matchMakeModel && !matchOwner) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort
        if (sortBy === "most-jobs") {
          return b.jobsCount - a.jobsCount;
        } else if (sortBy === "latest-job") {
          return b.latestJobDate - a.latestJobDate;
        } else {
          // newest added
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [vehicles, customers, jobs, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reg no, make, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[140px]">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="service-due">Service Due</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative min-w-[150px]">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent cursor-pointer"
            >
              <option value="newest">Newest Added</option>
              <option value="latest-job">Latest Job</option>
              <option value="most-jobs">Most Jobs</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="w-full overflow-auto max-h-[calc(100vh-200px)]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur shadow-[0_1px_0_rgba(0,0,0,0.1)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr className="border-b border-gray-100">
                <th className="px-3 py-2">Reg. No</th>
                <th className="px-3 py-2">Make/Model</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2 text-right">Jobs</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {processedVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-gray-500">
                    {vehicles.length === 0 ? "No registered vehicles yet." : "No vehicles match your search or filters."}
                  </td>
                </tr>
              )}
              {processedVehicles.map((vehicle) => {
                return (
                  <tr
                    key={vehicle.id}
                    onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 font-mono font-bold text-theme-accent">
                      {vehicle.registration_number}
                    </td>
                    <td className="px-3 py-2 text-gray-900 font-medium">
                      {vehicle.manufacturer} {vehicle.model}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {vehicle.customerName || "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900 tabular-nums">
                      {vehicle.jobsCount}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          vehicle.serviceDue
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {vehicle.serviceDue ? "Service Due" : "Active"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <ChevronRight className="inline-block h-4 w-4 text-gray-300" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
