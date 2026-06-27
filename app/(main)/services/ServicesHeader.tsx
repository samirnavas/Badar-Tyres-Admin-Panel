"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";

export function ServicesHeader() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Service Catalog
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your workshop's service items, pricing, and stock status.
        </p>
      </div>
      <button
        onClick={() => setAddOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        <Plus className="h-4 w-4" /> Add New Service
      </button>

      <ServiceFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}
