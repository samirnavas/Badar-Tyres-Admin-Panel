"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, PackageCheck, PackageX } from "lucide-react";
import { getServices } from "@/lib/repositories";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, cn } from "@/lib/format";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";

export default function ServicesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const servicesQuery = useQuery({
    queryKey: ["service-catalog"],
    queryFn: getServices,
  });

  const filtered = (servicesQuery.data ?? []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Services & Parts Catalog
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your workshop's service items, pricing, and stock status.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
        >
          <Plus className="h-4 w-4" /> Add New Service
        </button>
      </div>

      {/* Main Content */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4 sm:px-6">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3.5">Service / Part Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-right">Price</th>
                <th className="px-6 py-3.5 text-right">GST Rate</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {servicesQuery.isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              )}

              {servicesQuery.isError && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-theme-accent">
                    Failed to load services.
                  </td>
                </tr>
              )}

              {!servicesQuery.isLoading && !servicesQuery.isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No services found matching your search.
                  </td>
                </tr>
              )}

              {!servicesQuery.isLoading && !servicesQuery.isError && filtered.map((service) => (
                <tr key={service.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {service.category}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 tabular-nums">
                    ₹ {formatCurrency(service.price)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 tabular-nums">
                    {service.gst_rate}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        service.in_stock
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {service.in_stock ? (
                        <>
                          <PackageCheck className="h-3.5 w-3.5" /> In Stock
                        </>
                      ) : (
                        <>
                          <PackageX className="h-3.5 w-3.5" /> Out of Stock
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ServiceFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}
