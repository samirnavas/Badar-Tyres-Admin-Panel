"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
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

  return (
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
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  No registered vehicles yet.
                </td>
              </tr>
            )}
            {vehicles.map((vehicle) => {
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
                    {customer?.name || "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900 tabular-nums">
                    {vehicleJobs.length}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        serviceDue
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {serviceDue ? "Service Due" : "Active"}
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
  );
}
