"use client";

import { useState, useMemo } from "react";
import { formatCurrency, cn } from "@/lib/format";
import { PackageCheck, PackageX, Search, Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { ServiceActions } from "@/components/services/ServiceActions";
import type { Service } from "@/lib/models/Service";

export function ServicesTable({ services }: { services: Service[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in-stock" | "out-of-stock">("all");
  const [sortBy, setSortBy] = useState<"name-asc" | "price-desc" | "price-asc">("name-asc");

  const filteredServices = useMemo(() => {
    let result = services;

    // Filter by Status
    if (statusFilter === "in-stock") {
      result = result.filter(s => s.in_stock);
    } else if (statusFilter === "out-of-stock") {
      result = result.filter(s => !s.in_stock);
    }

    // Search
    const q = searchQuery.toLowerCase();
    if (q) {
      result = result.filter((service) => 
        service.name.toLowerCase().includes(q) ||
        service.category.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === "price-desc") {
        return b.price - a.price;
      } else if (sortBy === "price-asc") {
        return a.price - b.price;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  }, [services, searchQuery, statusFilter, sortBy]);

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search services by name or category..."
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
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative min-w-[160px]">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent cursor-pointer"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="price-asc">Price (Low to High)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur shadow-[0_1px_0_rgba(0,0,0,0.1)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">Price</th>
              <th className="px-3 py-2 text-right">GST Rate</th>
              <th className="px-3 py-2 text-center whitespace-nowrap">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredServices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-gray-500">
                  {services.length === 0 ? "No services found." : "No services match your search or filters."}
                </td>
              </tr>
            )}
            {filteredServices.map((service) => (
              <tr key={service.id} className="transition-colors hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-900">{service.name}</td>
                <td className="px-3 py-2 text-gray-600">{service.category}</td>
                <td className="px-3 py-2 text-right text-gray-900 tabular-nums whitespace-nowrap">
                  ₹ {formatCurrency(service.price)}
                </td>
                <td className="px-3 py-2 text-right text-gray-600 tabular-nums">
                  {service.gst_rate}%
                </td>
                <td className="px-3 py-2 text-center whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      service.in_stock
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
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
                <td className="px-3 py-2">
                  <ServiceActions service={service} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
