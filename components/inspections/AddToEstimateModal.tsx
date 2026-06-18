"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, PlusCircle } from "lucide-react";
import { getServices, getParts, appendLineItemToJob } from "@/lib/repositories";
import { getSettings } from "@/lib/repositories/settings_repository";
import type { InspectionItem } from "@/lib/models/Inspection";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { cn, formatCurrency } from "@/lib/format";

export function AddToEstimateModal({
  open,
  onClose,
  jobId,
  inspectionItem,
}: {
  open: boolean;
  onClose: () => void;
  jobId: string;
  inspectionItem: InspectionItem | null;
}) {
  const queryClient = useQueryClient();
  const [itemKey, setItemKey] = useState("");
  const [quantity, setQuantity] = useState(1);

  const servicesQuery = useQuery({
    queryKey: ["service-catalog"],
    queryFn: getServices,
    enabled: open,
  });
  const partsQuery = useQuery({
    queryKey: ["inventory"],
    queryFn: getParts,
    enabled: open,
  });
  const settingsQuery = useQuery({
    queryKey: ["shop-settings"],
    queryFn: getSettings,
    enabled: open,
  });

  const defaultGstRate = settingsQuery.data?.default_gst_rate ?? 18;

  useEffect(() => {
    if (open) {
      setItemKey("");
      setQuantity(1);
    }
  }, [open, inspectionItem]);

  const lineItemOptions: ComboboxOption[] = useMemo(() => {
    const serviceOptions = (servicesQuery.data ?? []).map((service) => ({
      value: `service:${service.id}`,
      label: service.name,
      hint: `Service · ₹${formatCurrency(service.price)}`,
    }));
    /*
    const partOptions = (partsQuery.data ?? []).map((part) => ({
      value: `part:${part.id}`,
      label: part.name,
      hint: `Part · ₹${formatCurrency(part.retailPrice)}`,
    }));
    */
    return [...serviceOptions /*, ...partOptions*/];
  }, [servicesQuery.data, partsQuery.data]);

  const selectedPreview = useMemo(() => {
    if (!itemKey) return null;
    const [type, id] = itemKey.split(":");
    if (type === "service") {
      const service = (servicesQuery.data ?? []).find((entry) => entry.id === id);
      if (!service) return null;
      return {
        name: service.name,
        unitPrice: service.price,
        gst_rate: service.gst_rate,
        serviceId: service.id,
        partId: undefined as string | undefined,
      };
    }
    if (type === "part") {
      const part = (partsQuery.data ?? []).find((entry) => entry.id === id);
      if (!part) return null;
      return {
        name: part.name,
        unitPrice: part.retailPrice,
        gst_rate: defaultGstRate,
        serviceId: undefined as string | undefined,
        partId: part.id,
      };
    }
    return null;
  }, [itemKey, servicesQuery.data, partsQuery.data, defaultGstRate]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedPreview) {
        throw new Error("Select a service or part to add.");
      }

      return appendLineItemToJob(jobId, {
        serviceId: selectedPreview.serviceId,
        partId: selectedPreview.partId,
        name: selectedPreview.name,
        quantity,
        unitPrice: selectedPreview.unitPrice,
        gst_rate: selectedPreview.gst_rate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobCard", jobId] });
      queryClient.invalidateQueries({ queryKey: ["job-cards"] });
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !inspectionItem || typeof document === "undefined") return null;

  const lineTotal = (selectedPreview?.unitPrice ?? 0) * quantity;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add inspection finding to estimate"
        className="relative w-full max-w-lg rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl [color-scheme:light]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
              <PlusCircle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Add to Estimate
              </h2>
              <p className="text-xs text-gray-500">
                Convert an inspection finding into billable work
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Inspection Finding
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {inspectionItem.system}
            </p>
            <p className="mt-1 text-sm text-gray-600">{inspectionItem.notes}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Service or Part
            </label>
            <Combobox
              options={lineItemOptions}
              value={itemKey}
              onChange={setItemKey}
              placeholder={
                servicesQuery.isLoading || partsQuery.isLoading
                  ? "Loading catalog..."
                  : "Search service or part..."
              }
              disabled={servicesQuery.isLoading || partsQuery.isLoading}
              className={inputClass(false)}
              emptyMessage="No services or parts found"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className={inputClass(false)}
            />
          </div>

          {selectedPreview && (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Unit price</span>
                <span className="font-medium text-gray-900 tabular-nums">
                  ₹{formatCurrency(selectedPreview.unitPrice)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
                <span>Line total</span>
                <span className="tabular-nums">₹{formatCurrency(lineTotal)}</span>
              </div>
            </div>
          )}

          {mutation.isError && (
            <p className="text-xs font-medium text-theme-accent">
              {(mutation.error as Error)?.message ?? "Failed to add line item."}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedPreview || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mutation.isPending ? "Adding..." : "Add to Job Estimate"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function inputClass(hasError: boolean): string {
  return cn(
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1",
    hasError
      ? "border-theme-accent focus:border-theme-accent focus:ring-theme-accent"
      : "border-gray-200 focus:border-theme-accent focus:ring-theme-accent",
  );
}
