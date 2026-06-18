"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { X, Loader2, Package } from "lucide-react";
import { createPart, updatePart } from "@/lib/repositories/part_repository";
import {
  partSchema,
  partCategories,
  type Part,
  type PartInput,
} from "@/lib/models/Part";
import { cn } from "@/lib/format";

const defaultValues: PartInput = {
  name: "",
  sku: "",
  category: "General",
  brand: "",
  costPrice: 0,
  retailPrice: 0,
  stockLevel: 0,
  minStockThreshold: 5,
  location: "",
};

export function PartFormModal({
  open,
  onClose,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: Part | null;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartInput>({
    resolver: zodResolver(partSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        name: initialData.name,
        sku: initialData.sku,
        category: initialData.category,
        brand: initialData.brand,
        costPrice: initialData.costPrice,
        retailPrice: initialData.retailPrice,
        stockLevel: initialData.stockLevel,
        minStockThreshold: initialData.minStockThreshold,
        location: initialData.location,
      });
    } else {
      reset(defaultValues);
    }
  }, [open, initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: PartInput) =>
      initialData
        ? updatePart(initialData.id, values)
        : createPart(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      router.refresh();
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

  if (!open || typeof document === "undefined") return null;

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
        aria-label={initialData ? "Edit part" : "Add new part"}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl [color-scheme:light]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
              <Package className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              {initialData ? "Edit Part" : "Add New Part"}
            </h2>
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

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4 p-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU" error={errors.sku?.message}>
              <input
                autoFocus
                {...register("sku")}
                placeholder="e.g. TYRE-205-55"
                className={inputClass(!!errors.sku)}
              />
            </Field>

            <Field label="Category" error={errors.category?.message}>
              <select
                {...register("category")}
                className={inputClass(!!errors.category)}
              >
                {partCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Name" error={errors.name?.message}>
            <input
              {...register("name")}
              placeholder="e.g. Michelin Primacy 4"
              className={inputClass(!!errors.name)}
            />
          </Field>

          <Field label="Brand" error={errors.brand?.message}>
            <input
              {...register("brand")}
              placeholder="e.g. Michelin"
              className={inputClass(!!errors.brand)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cost Price (INR)" error={errors.costPrice?.message}>
              <input
                type="number"
                step="0.01"
                {...register("costPrice", { valueAsNumber: true })}
                className={inputClass(!!errors.costPrice)}
              />
            </Field>

            <Field label="Retail Price (INR)" error={errors.retailPrice?.message}>
              <input
                type="number"
                step="0.01"
                {...register("retailPrice", { valueAsNumber: true })}
                className={inputClass(!!errors.retailPrice)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Stock Level" error={errors.stockLevel?.message}>
              <input
                type="number"
                {...register("stockLevel", { valueAsNumber: true })}
                className={inputClass(!!errors.stockLevel)}
              />
            </Field>

            <Field
              label="Min Stock Threshold"
              error={errors.minStockThreshold?.message}
            >
              <input
                type="number"
                {...register("minStockThreshold", { valueAsNumber: true })}
                className={inputClass(!!errors.minStockThreshold)}
              />
            </Field>
          </div>

          <Field label="Location" error={errors.location?.message}>
            <input
              {...register("location")}
              placeholder="e.g. Aisle 3, Showroom"
              className={inputClass(!!errors.location)}
            />
          </Field>

          {mutation.isError && (
            <p className="text-xs font-medium text-theme-accent">
              {(mutation.error as Error)?.message ?? "Failed to save part."}
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
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mutation.isPending
                ? "Saving..."
                : initialData
                  ? "Update Part"
                  : "Save Part"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-medium text-theme-accent">{error}</p>
      )}
    </div>
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
