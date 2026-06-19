"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { X, Loader2, Tag } from "lucide-react";
import { applyDiscount } from "@/lib/repositories/invoice_repository";
import type { Invoice } from "@/lib/models/Invoice";
import { cn, formatCurrency } from "@/lib/format";
import { toast } from "sonner";

const discountSchema = z.object({
  discountType: z.enum(["fixed", "percentage"]),
  discountInput: z.number().min(0, "Amount must be zero or greater"),
});

type DiscountFormValues = z.infer<typeof discountSchema>;

const inputClass = (error: boolean) =>
  cn(
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900",
    error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"
  );

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
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function ApplyDiscountModal({
  open,
  onClose,
  invoice,
  originalSubtotal,
  originalTax,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  originalSubtotal: number;
  originalTax: number;
  onSuccess: () => void;
}) {
  const originalTotal = originalSubtotal + originalTax;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      discountType: invoice?.discountType ?? "fixed",
      discountInput: invoice?.discountType === "percentage"
        ? (invoice.discountAmount ?? 0)
        : (originalTotal - (invoice?.discountAmount ?? 0)),
    },
  });

  const discountType = watch("discountType") || "fixed";
  const discountInput = watch("discountInput") || 0;

  let actualDiscountAmount = 0;
  if (discountType === "percentage") {
    actualDiscountAmount = discountInput;
  } else {
    actualDiscountAmount = Math.max(0, originalTotal - discountInput);
  }

  const discountValue =
    discountType === "percentage"
      ? originalTotal * (actualDiscountAmount / 100)
      : actualDiscountAmount;

  const newTotal = Math.max(0, originalTotal - discountValue);

  useEffect(() => {
    if (open && invoice) {
      reset({
        discountType: invoice.discountType ?? "fixed",
        discountInput: invoice.discountType === "percentage"
          ? (invoice.discountAmount ?? 0)
          : (originalTotal - (invoice.discountAmount ?? 0)),
      });
    }
  }, [open, invoice, reset, originalTotal]);

  const mutation = useMutation({
    mutationFn: (values: DiscountFormValues) => {
      if (!invoice) throw new Error("Invoice not found");
      return applyDiscount(invoice.id, actualDiscountAmount, values.discountType);
    },
    onSuccess: (_, variables) => {
      toast.success("Discount applied successfully");
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message || "Failed to apply discount"),
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

  if (!open || !invoice || typeof document === "undefined") return null;

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
        aria-label="Apply discount"
        className="relative w-full max-w-md rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl [color-scheme:light]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white">
              <Tag className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Apply Discount
              </h2>
              <p className="text-xs text-gray-500">
                Original Total: ₹{formatCurrency(originalTotal)}
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

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4 p-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount Type" error={errors.discountType?.message}>
              <select
                {...register("discountType")}
                className={inputClass(!!errors.discountType)}
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </Field>
            <Field label={discountType === "percentage" ? "Discount Percentage (%)" : "Final Amount To Charge (INR)"} error={errors.discountInput?.message}>
              <input
                type="number"
                step="0.01"
                min={0}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                {...register("discountInput", { valueAsNumber: true })}
                className={inputClass(!!errors.discountInput)}
              />
            </Field>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Calculated Discount:{" "}
            <span className="font-semibold text-theme-accent tabular-nums">
              -₹{formatCurrency(discountValue)}
            </span>
            <br />
            New Invoice Total:{" "}
            <span className="font-semibold text-gray-900 tabular-nums">
              ₹{formatCurrency(newTotal)}
            </span>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Apply Discount
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
