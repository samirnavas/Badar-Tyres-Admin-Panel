"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Warehouse, Trash2 } from "lucide-react";
import { updateBay, createBay, deleteBay } from "@/lib/repositories/bay_repository";
import type { Bay, BayStatus } from "@/lib/models/Bay";
import { cn } from "@/lib/format";
import { Combobox } from "@/components/ui/Combobox";

const baySchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["Open", "Occupied", "Maintenance"]),
});

type BayFormValues = z.infer<typeof baySchema>;

export function BayFormModal({
  open,
  onClose,
  bay,
}: {
  open: boolean;
  onClose: () => void;
  bay?: Bay | null;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BayFormValues>({
    resolver: zodResolver(baySchema),
    defaultValues: {
      name: "",
      status: "Open",
    },
  });

  useEffect(() => {
    if (open && bay) {
      reset({
        name: bay.name,
        status: bay.status,
      });
    } else if (open && !bay) {
      reset({
        name: "",
        status: "Open",
      });
    }
  }, [open, bay, reset]);

  const mutation = useMutation({
    mutationFn: (values: BayFormValues) => {
      if (bay) {
        return updateBay(bay.id, {
          name: values.name.trim(),
          status: values.status,
        });
      } else {
        return createBay({
          name: values.name.trim(),
          status: values.status,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bays"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!bay) throw new Error("No bay to delete");
      return deleteBay(bay.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bays"] });
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
        aria-label={bay ? "Edit Bay" : "Add New Bay"}
        className="relative w-full max-w-md rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl [color-scheme:light]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Warehouse className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              {bay ? "Edit Service Bay" : "Add Service Bay"}
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
          <Field label="Bay Name" error={errors.name?.message}>
            <input
              autoFocus
              {...register("name")}
              placeholder="e.g. Bay 1"
              className={inputClass(!!errors.name)}
            />
          </Field>

          <Field label="Status" error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Combobox
                  options={[
                    { value: "Open", label: "Open" },
                    { value: "Occupied", label: "Occupied (Disabled)" },
                    { value: "Maintenance", label: "Maintenance" },
                  ].filter(opt => opt.value !== "Occupied" || bay?.status === "Occupied")}
                  value={field.value}
                  onChange={field.onChange}
                  className={inputClass(!!errors.status)}
                  disabled={bay?.status === "Occupied"}
                  placeholder="Select status..."
                />
              )}
            />
          </Field>
          {bay?.status === "Occupied" && (
            <p className="text-xs text-amber-600 mt-1">
              Status cannot be changed manually while a job is in progress.
            </p>
          )}

          {mutation.isError && (
            <p className="text-xs font-medium text-theme-accent">
              {(mutation.error as Error)?.message ?? "Failed to save bay."}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            {bay ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this bay?")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending || bay.status === "Occupied"}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={bay.status === "Occupied" ? "Cannot delete occupied bay" : "Delete Bay"}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            ) : (
              <div /> // Spacer
            )}
            
            <div className="flex items-center gap-2">
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
                {mutation.isPending ? "Saving..." : "Save Bay"}
              </button>
            </div>
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
