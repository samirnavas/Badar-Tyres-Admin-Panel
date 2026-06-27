"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, AlertCircle } from "lucide-react";
import { getParts } from "@/lib/repositories/part_repository";
import { PartFormModal } from "@/components/inventory/PartFormModal";
import { formatCurrency, cn } from "@/lib/format";
import type { Part } from "@/lib/models/Part";

const categoryStyles: Record<Part["category"], string> = {
  Tyre: "border-blue-200 bg-blue-50 text-blue-700",
  Oil: "border-amber-200 bg-amber-50 text-amber-700",
  Battery: "border-green-200 bg-green-50 text-green-700",
  General: "border-gray-200 bg-gray-50 text-gray-700",
};

export default function InventoryClient() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["inventory"],
    queryFn: getParts,
  });

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (part) =>
        part.sku.toLowerCase().includes(q) ||
        part.name.toLowerCase().includes(q),
    );
  }, [data, search]);

  const openAddModal = () => {
    setEditingPart(null);
    setModalOpen(true);
  };

  const openEditModal = (part: Part) => {
    setEditingPart(part);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPart(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Inventory & Parts
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track stock levels, pricing, and storage locations for workshop parts.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
        >
          <Plus className="h-4 w-4" /> Add Part
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU or name..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
            />
          </div>
        </div>

        <div className="w-full overflow-auto max-h-[calc(100vh-200px)]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur shadow-[0_1px_0_rgba(0,0,0,0.1)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr className="border-b border-gray-100">
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Retail Price</th>
                <th className="px-3 py-2 text-right">Stock Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Loading inventory...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-theme-accent">
                    Failed to load inventory.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No parts found.
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                filtered.map((part) => {
                  const isLowStock = part.stockLevel <= part.minStockThreshold;

                  return (
                    <tr
                      key={part.id}
                      onClick={() => openEditModal(part)}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 font-mono text-xs font-medium text-gray-600">
                        {part.sku}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {part.name}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{part.brand}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            categoryStyles[part.category],
                          )}
                        >
                          {part.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900 tabular-nums">
                        ₹{formatCurrency(part.retailPrice)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="inline-flex items-center justify-end gap-1.5 font-semibold tabular-nums text-gray-900">
                          {part.stockLevel}
                          {isLowStock && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600"
                              title="Low stock"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Low
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <PartFormModal
        open={modalOpen}
        onClose={closeModal}
        initialData={editingPart}
      />
    </div>
  );
}
