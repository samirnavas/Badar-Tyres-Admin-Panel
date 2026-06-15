"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Wrench } from "lucide-react";
import { createService } from "@/lib/repositories";
import type { Service } from "@/lib/models/Service";
import { cn } from "@/lib/format";

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  gst_rate: z.number().min(0, "GST must be positive"),
  in_stock: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export function ServiceFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (service: Service) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", category: "General", price: 0, gst_rate: 18, in_stock: true },
  });

  useEffect(() => {
    if (open) reset({ name: "", category: "General", price: 0, gst_rate: 18, in_stock: true });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: ServiceFormValues) => createService(values),
    onSuccess: (service) => {
      queryClient.setQueryData<Service[]>(["service-catalog"], (old) =>
        old ? [service, ...old] : [service],
      );
      queryClient.invalidateQueries({ queryKey: ["service-catalog"] });
      onCreated?.(service);
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
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add new service"
        className="relative w-full max-w-md rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl [color-scheme:light]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
              <Wrench className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              Add New Service
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
          <Field label="Service / Part Name" error={errors.name?.message}>
            <input
              autoFocus
              {...register("name")}
              placeholder="e.g. Wheel Alignment"
              className={inputClass(!!errors.name)}
            />
          </Field>

          <Field label="Category" error={errors.category?.message}>
            <input
              {...register("category")}
              placeholder="e.g. Alignment, Tyres, Oil"
              className={inputClass(!!errors.category)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (INR)" error={errors.price?.message}>
              <input
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
                className={inputClass(!!errors.price)}
              />
            </Field>

            <Field label="GST Rate (%)" error={errors.gst_rate?.message}>
              <input
                type="number"
                {...register("gst_rate", { valueAsNumber: true })}
                className={inputClass(!!errors.gst_rate)}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              {...register("in_stock")}
              className="h-4 w-4 rounded border-gray-300 text-theme-accent focus:ring-theme-accent"
            />
            <span className="text-sm font-medium text-gray-900">In Stock / Available</span>
          </label>

          {mutation.isError && (
            <p className="text-xs font-medium text-theme-accent">
              {(mutation.error as Error)?.message ?? "Failed to save service."}
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
              {mutation.isPending ? "Saving..." : "Save Service"}
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
