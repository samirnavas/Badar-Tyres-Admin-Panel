"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, UserPlus } from "lucide-react";
import { createCustomer } from "@/lib/repositories";
import type { Customer } from "@/lib/models/Customer";
import { cn } from "@/lib/format";

const customerSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^[0-9+\-\s]+$/, "Digits only"),
  email: z
    .union([z.string().email("Enter a valid email"), z.literal("")])
    .optional(),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export function CustomerFormModal({
  open,
  onClose,
  onCreated,
  initialName = "",
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (customer: Customer) => void;
  initialName?: string;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: initialName, phone: "", email: "", address: "" },
  });

  // Re-seed the form each time the modal opens (e.g. with the search term
  // pre-filled when launched from the job-card combobox).
  useEffect(() => {
    if (open) reset({ name: initialName, phone: "", email: "", address: "" });
  }, [open, initialName, reset]);

  const mutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      createCustomer({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim() ?? "",
        address: values.address?.trim() ?? "",
      }),
    onSuccess: (customer) => {
      queryClient.setQueryData<Customer[]>(["customers"], (old) =>
        old ? [...old, customer] : [customer],
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onCreated?.(customer);
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
        aria-label="Add new customer"
        className="relative w-full max-w-md rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl [color-scheme:light]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <UserPlus className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              Add New Customer
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
          <Field label="Full Name" error={errors.name?.message}>
            <input
              autoFocus
              {...register("name")}
              placeholder="e.g. Arjun Pillai"
              className={inputClass(!!errors.name)}
            />
          </Field>

          <Field label="Phone Number" error={errors.phone?.message}>
            <input
              {...register("phone")}
              placeholder="+91 ..."
              className={inputClass(!!errors.phone)}
            />
          </Field>

          <Field label="Email (optional)" error={errors.email?.message}>
            <input
              {...register("email")}
              placeholder="name@example.com"
              className={inputClass(!!errors.email)}
            />
          </Field>

          <Field label="Address (optional)" error={errors.address?.message}>
            <textarea
              {...register("address")}
              rows={2}
              placeholder="Street, city, state, PIN"
              className={cn(inputClass(!!errors.address), "resize-none")}
            />
          </Field>

          {mutation.isError && (
            <p className="text-xs font-medium text-theme-accent">
              {(mutation.error as Error)?.message ?? "Failed to save customer."}
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
              {mutation.isPending ? "Saving..." : "Save Customer"}
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
