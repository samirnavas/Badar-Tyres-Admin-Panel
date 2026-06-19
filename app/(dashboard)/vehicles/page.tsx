export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { cn } from "@/lib/format";
import { getVehicles, getCustomers, getJobCards } from "@/lib/repositories";
import type { Vehicle } from "@/lib/models/Vehicle";
import type { JobCard } from "@/lib/models/JobCard";
import type { Customer } from "@/lib/models/Customer";
import { VehiclesTable } from "./VehiclesTable";

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
          <Plus className="h-4 w-4" /> New Job Card
        </Link>
      </div>

      <VehiclesTable vehicles={vehicles} customers={customers} jobs={jobs} />

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
