"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteService } from "@/lib/repositories/service_repository";
import { ServiceFormModal } from "./ServiceFormModal";
import type { Service } from "@/lib/models/Service";

export function ServiceActions({ service }: { service: Service }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(service.id);
      router.refresh();
    } catch (e) {
      alert("Failed to delete service.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <ServiceFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialData={service}
      />
    </>
  );
}
