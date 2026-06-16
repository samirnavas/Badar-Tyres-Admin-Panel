"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Loader2, CarFront } from "lucide-react";
import { createVehicle, updateVehicle, getManufacturers } from "@/lib/repositories";
import type { Vehicle, VehicleType } from "@/lib/models/Vehicle";
import { cn } from "@/lib/format";
import { Combobox } from "@/components/ui/Combobox";

const vehicleSchema = z.object({
  type: z.enum(["Car", "Bike", "Others"]),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  registration_number: z.string().min(1, "Registration number is required"),
  chassis_number: z.string().optional(),
  engine_number: z.string().optional(),
  color: z.string().optional(),
  insurance_expiry: z.string().optional(),
  pollution_expiry: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function VehicleFormModal({
  open,
  onClose,
  customerId,
  vehicleToEdit,
}: {
  open: boolean;
  onClose: () => void;
  customerId: string;
  vehicleToEdit?: Vehicle | null;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      type: vehicleToEdit ? (vehicleToEdit.type as "Car" | "Bike" | "Others") : "Car",
      manufacturer: vehicleToEdit?.manufacturer || "",
      model: vehicleToEdit?.model || "",
      registration_number: vehicleToEdit?.registration_number || "",
      chassis_number: vehicleToEdit?.chassis_number || "",
      engine_number: vehicleToEdit?.engine_number || "",
      color: vehicleToEdit?.color || "",
      insurance_expiry: vehicleToEdit?.insurance_expiry || "",
      pollution_expiry: vehicleToEdit?.pollution_expiry || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: vehicleToEdit ? (vehicleToEdit.type as "Car" | "Bike" | "Others") : "Car",
        manufacturer: vehicleToEdit?.manufacturer || "",
        model: vehicleToEdit?.model || "",
        registration_number: vehicleToEdit?.registration_number || "",
        chassis_number: vehicleToEdit?.chassis_number || "",
        engine_number: vehicleToEdit?.engine_number || "",
        color: vehicleToEdit?.color || "",
        insurance_expiry: vehicleToEdit?.insurance_expiry || "",
        pollution_expiry: vehicleToEdit?.pollution_expiry || "",
      });
    }
  }, [open, vehicleToEdit, reset]);

  const mutation = useMutation({
    mutationFn: (values: VehicleFormValues) => {
      const payload = {
        type: values.type as VehicleType,
        manufacturer: values.manufacturer.trim(),
        model: values.model.trim(),
        registration_number: values.registration_number.trim(),
        chassis_number: values.chassis_number?.trim() || "",
        engine_number: values.engine_number?.trim() || "",
        color: values.color?.trim() || "",
        insurance_expiry: values.insurance_expiry || null,
        pollution_expiry: values.pollution_expiry || null,
      };
      
      if (vehicleToEdit) {
        return updateVehicle(vehicleToEdit.id, payload);
      } else {
        return createVehicle({
          ...payload,
          customer_id: customerId,
          next_service_date: null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles-by-customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
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

  const vehicleType = useWatch({
    control,
    name: "type",
  });

  const manufacturersQuery = useQuery({
    queryKey: ["manufacturers"],
    queryFn: getManufacturers,
  });

  const manufacturerOptions =
    manufacturersQuery.data?.map((m) => ({ label: m.name, value: m.name })) ?? [];

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
        aria-label="Add new vehicle"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl [color-scheme:light]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <CarFront className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              {vehicleToEdit ? "Edit Vehicle" : "Add New Vehicle"}
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
          <Field label="Vehicle Type" error={errors.type?.message}>
            <select
              {...register("type")}
              className={inputClass(!!errors.type)}
            >
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="Others">Others</option>
            </select>
          </Field>

          <Field label="Manufacturer" error={errors.manufacturer?.message}>
            <Controller
              control={control}
              name="manufacturer"
              render={({ field }) => (
                <Combobox
                  options={manufacturerOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Select manufacturer..."
                  disabled={manufacturersQuery.isLoading}
                  className={inputClass(!!errors.manufacturer)}
                  emptyMessage="No manufacturers"
                />
              )}
            />
          </Field>

          <Field label="Model" error={errors.model?.message}>
            <input
              {...register("model")}
              placeholder="e.g. Innova"
              className={inputClass(!!errors.model)}
            />
          </Field>

          <Field label="Registration Number" error={errors.registration_number?.message}>
            <input
              {...register("registration_number", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
              placeholder="E.G. KL-07-AB-1234"
              className={cn(inputClass(!!errors.registration_number), "uppercase")}
            />
          </Field>

          <Field label="Chassis Number (Optional)" error={errors.chassis_number?.message}>
            <input
              {...register("chassis_number")}
              placeholder="e.g. MA123..."
              className={inputClass(!!errors.chassis_number)}
            />
          </Field>

          <Field label="Engine Number (Optional)" error={errors.engine_number?.message}>
            <input
              {...register("engine_number")}
              placeholder="e.g. 1TR..."
              className={inputClass(!!errors.engine_number)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Insurance Expiry" error={errors.insurance_expiry?.message}>
              <input
                type="date"
                {...register("insurance_expiry")}
                className={inputClass(!!errors.insurance_expiry)}
              />
            </Field>
            <Field label="Pollution Expiry" error={errors.pollution_expiry?.message}>
              <input
                type="date"
                {...register("pollution_expiry")}
                className={inputClass(!!errors.pollution_expiry)}
              />
            </Field>
          </div>

          <Field label="Color (Optional)" error={errors.color?.message}>
            <input
              {...register("color")}
              placeholder="e.g. Pearl White"
              className={inputClass(!!errors.color)}
            />
          </Field>

          {mutation.isError && (
            <p className="text-xs font-medium text-theme-accent">
              {(mutation.error as Error)?.message ?? "Failed to save vehicle."}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
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
              {mutation.isPending ? "Saving..." : "Save Vehicle"}
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
