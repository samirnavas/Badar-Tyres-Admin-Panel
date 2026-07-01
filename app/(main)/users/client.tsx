"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, ChevronRight, Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { getCustomersListWithLTV } from "@/lib/repositories";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";
import { formatCurrency, cn } from "@/lib/format";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CustomersClient() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["customers-ltv"],
    queryFn: getCustomersListWithLTV,
  });

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "Retail" | "Corporate" | "Fleet">("all");
  const [sortBy, setSortBy] = useState<"ltv-desc" | "name-asc" | "newest">("ltv-desc");
  
  const [addOpen, setAddOpen] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    let result = data;
    
    // Filter
    if (filterType !== "all") {
      result = result.filter(item => {
        const type = item.customer.customer_type || "Retail";
        return type === filterType;
      });
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (item) =>
          item.customer.name.toLowerCase().includes(q) ||
          item.customer.phone.toLowerCase().includes(q) ||
          (item.customer.email && item.customer.email.toLowerCase().includes(q)),
      );
    }
    
    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === "ltv-desc") {
        return b.ltv - a.ltv;
      } else if (sortBy === "name-asc") {
        return a.customer.name.localeCompare(b.customer.name);
      } else {
        return new Date(b.customer.created_at).getTime() - new Date(a.customer.created_at).getTime();
      }
    });
  }, [data, search, filterType, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Customer Relationship Management (CRM)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse customer profiles, fleets, and lifetime value.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
        >
          <Plus className="h-4 w-4" /> Add New Customer
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[140px]">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Retail">Retail</option>
              <option value="Corporate">Corporate</option>
              <option value="Fleet">Fleet</option>
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
              <option value="ltv-desc">Highest LTV</option>
              <option value="newest">Newest Added</option>
              <option value="name-asc">Name (A-Z)</option>
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
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Lifetime Value</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Loading customers...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-theme-accent">
                    Failed to load customers.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No customers match your search or filters.
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                filtered.map(({ customer, ltv }) => (
                  <tr
                    key={customer.id}
                    onClick={() => router.push(`/users/${customer.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-theme-accent/10 text-xs font-semibold text-theme-accent">
                          {initials(customer.name)}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {customer.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {customer.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600 font-medium">
                      {customer.phone}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          customer.customer_type === "Corporate"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : customer.customer_type === "Fleet"
                            ? "border-purple-200 bg-purple-50 text-purple-700"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        )}
                      >
                        {customer.customer_type || "Retail"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-base font-bold text-gray-900 tabular-nums">
                      ₹{formatCurrency(ltv)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <ChevronRight className="inline-block h-4 w-4 text-gray-300" />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(customer) => {
          router.push(`/users/${customer.id}`);
        }}
      />
    </div>
  );
}
